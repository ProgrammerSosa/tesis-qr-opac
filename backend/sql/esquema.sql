-- Esquema de la biblioteca en PostgreSQL (Supabase u otro). El servidor lo ejecuta solo al arrancar cuando hay DATABASE_URL, y se puede
-- correr a mano en el editor SQL de Supabase: todo es idempotente (se puede repetir sin problema).
--
-- Cómo se guarda: la aplicación trabaja con sus datos en memoria y guarda cada tipo de dato como un documento JSON en la tabla
-- `biblioteca.almacen` (una fila por tipo: catalogo, reservas, solvencia, cuentas, horarios, configuracion, actividad y eventos).
-- Las vistas `v_...` muestran esos documentos como tablas, para mirarlos y exportarlos a CSV desde el panel de Supabase. Son de solo
-- lectura: los cambios se hacen desde el panel de la biblioteca, no editando aquí.
--
-- Privacidad: todo vive en el esquema `biblioteca`, que la API pública de Supabase no expone, y se le quita el acceso a los roles
-- públicos (`anon` y `authenticated`). Hay carnés, CUI y correos de estudiantes: no lo pongas en `public`.

create schema if not exists biblioteca;

create table if not exists biblioteca.almacen (
  nombre      text primary key,
  valor       jsonb not null,
  actualizado timestamptz not null default now()
);

comment on table biblioteca.almacen is 'Un documento JSON por tipo de dato de la biblioteca. Lo escribe solo el servidor.';

alter table biblioteca.almacen enable row level security;

do $$
declare
  rol text;
begin
  foreach rol in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = rol) then
      execute format('revoke all on schema biblioteca from %I', rol);
      execute format('revoke all on all tables in schema biblioteca from %I', rol);
    end if;
  end loop;
end
$$;

-- Las vistas se rehacen en cada arranque (así un cambio de columnas no estorba).
drop view if exists biblioteca.v_reservas;
drop view if exists biblioteca.v_tesis;
drop view if exists biblioteca.v_solicitudes_solvencia;
drop view if exists biblioteca.v_cuentas;
drop view if exists biblioteca.v_actividad;
drop view if exists biblioteca.v_eventos;
drop view if exists biblioteca.v_cierres;

create view biblioteca.v_reservas as
select
  r->>'id'                                                          as reserva,
  r->>'codigoConfirmacion'                                          as codigo,
  case r->>'tipo' when 'cubiculo' then 'Cubículo' when 'estacion' then 'Estación'
                  when 'sala_lectura' then 'Sala de lectura' else r->>'tipo' end as tipo,
  r->>'recursoNombre'                                               as lugar,
  nullif(r->>'fecha', '')::date                                     as fecha,
  r->>'hora'                                                        as desde,
  r->>'horaFin'                                                     as hasta,
  nullif(r->>'duracion', '')::int                                   as horas,
  r->>'estado'                                                      as estado,
  r->>'solicitante'                                                 as persona,
  r->>'identificacion'                                              as carne,
  r->>'correo'                                                      as correo,
  r->>'kiosco'                                                      as kiosco,
  r->>'motivoLiberacion'                                            as motivo_liberacion,
  coalesce((r->>'salioAntes')::boolean, false)                      as salio_antes,
  nullif(r->>'creadoEn', '')::timestamptz                           as creada_en,
  nullif(r->>'ingresoEn', '')::timestamptz                          as ingreso_en,
  nullif(r->>'salidaEn', '')::timestamptz                           as salida_en
from biblioteca.almacen a,
     jsonb_array_elements(coalesce(a.valor->'reservas', '[]'::jsonb)) r
where a.nombre = 'reservas';

create view biblioteca.v_tesis as
select
  t->>'id'                                                          as codigo,
  t->>'titulo'                                                      as titulo,
  t->>'autor'                                                       as autor,
  t->>'anio'                                                        as anio,
  t->>'programa'                                                    as programa,
  t->>'tipoDocumento'                                               as tipo,
  t->>'director'                                                    as director,
  t->>'estado'                                                      as estado,
  t->>'signatura'                                                   as signatura,
  t->'documentoDigital'->>'acceso'                                  as acceso_digital,
  coalesce((t->'documentoDigital'->>'activo')::boolean, false)      as documento_activo,
  t->'documentoDigital'->>'urlExterna'                              as url_de_la_tesis,
  coalesce((t->'qr'->>'activo')::boolean, false)                    as qr_activo,
  t->'qr'->>'destino'                                               as qr_lleva_a,
  t->'qr'->>'resultado'                                             as qr_resultado,
  nullif(t->'qr'->>'verificadoEn', '')::timestamptz                 as qr_verificado_en
from biblioteca.almacen a,
     jsonb_array_elements(coalesce(a.valor->'tesis', '[]'::jsonb)) t
where a.nombre = 'catalogo';

create view biblioteca.v_solicitudes_solvencia as
select
  s->>'id'                                                          as solicitud,
  s->>'codigoConfirmacion'                                          as codigo,
  s->>'estado'                                                      as estado,
  s->>'solicitante'                                                 as persona,
  s->>'identificacion'                                              as carne,
  s->>'cui'                                                         as cui,
  s->>'programa'                                                    as programa,
  s->>'motivo'                                                      as motivo,
  s->>'correo'                                                      as correo,
  s->>'ordenDePago'                                                 as orden_de_pago,
  nullif(s->>'fechaPapeleria', '')::date                            as fecha_papeleria,
  nullif(s->'entregaEstimada'->>'fecha', '')::date                  as entrega_fecha,
  s->'entregaEstimada'->>'hora'                                     as entrega_hora,
  s->>'observacion'                                                 as observacion,
  s->>'kiosco'                                                      as kiosco,
  nullif(s->>'creadoEn', '')::timestamptz                           as creada_en
from biblioteca.almacen a,
     jsonb_array_elements(coalesce(a.valor->'solicitudes', '[]'::jsonb)) s
where a.nombre = 'solvencia';

-- Sin la sal ni la clave cifrada: esas nunca se muestran.
create view biblioteca.v_cuentas as
select
  c->>'usuario'                                                     as usuario,
  c->>'nombre'                                                      as nombre,
  c->>'rol'                                                         as rol,
  coalesce((c->>'activa')::boolean, true)                           as activa,
  nullif(c->>'creadaEn', '')::timestamptz                           as creada_en,
  nullif(c->>'ultimoAcceso', '')::timestamptz                       as ultimo_acceso
from biblioteca.almacen a,
     jsonb_array_elements(coalesce(a.valor->'cuentas', '[]'::jsonb)) c
where a.nombre = 'cuentas';

create view biblioteca.v_actividad as
select
  nullif(r->>'fecha', '')::timestamptz                              as fecha,
  r->>'usuario'                                                     as usuario,
  r->>'nombre'                                                      as nombre,
  r->>'rol'                                                         as rol,
  r->>'accion'                                                      as accion,
  r->>'detalle'                                                     as detalle
from biblioteca.almacen a,
     jsonb_array_elements(coalesce(a.valor->'registros', '[]'::jsonb)) r
where a.nombre = 'actividad';

create view biblioteca.v_eventos as
select
  e->>'tipo'                                                        as tipo,
  e->>'kiosco'                                                      as kiosco,
  e->>'tesisId'                                                     as tesis,
  nullif(e->>'creadoEn', '')::timestamptz                           as creado_en
from biblioteca.almacen a,
     jsonb_array_elements(coalesce(a.valor->'eventos', '[]'::jsonb)) e
where a.nombre = 'eventos';

create view biblioteca.v_cierres as
select
  c->>'id'                                                          as cierre,
  nullif(c->>'desde', '')::date                                     as desde,
  nullif(c->>'hasta', '')::date                                     as hasta,
  c->>'motivo'                                                      as motivo
from biblioteca.almacen a,
     jsonb_array_elements(coalesce(a.valor->'cierres', '[]'::jsonb)) c
where a.nombre = 'horarios';

do $$
declare
  rol text;
begin
  foreach rol in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = rol) then
      execute format('revoke all on all tables in schema biblioteca from %I', rol);
    end if;
  end loop;
end
$$;
