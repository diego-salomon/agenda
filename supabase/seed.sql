-- Minimal live seed: a default tenant and the demo service catalog, so a fresh
-- project answers the public pages immediately. Replace per client.

insert into tenants (slug, name)
values ('default', 'Estudio Aurora')
on conflict (slug) do nothing;

insert into services (tenant_id, id, name, summary, description, benefits, duration_minutes, price, image_url, image_alt, image_width, image_height)
select t.id, v.id, v.name, v.summary, v.description, v.benefits, v.duration_minutes, v.price, v.image_url, v.image_alt, v.image_width, v.image_height
from tenants t
cross join (values
  ('consulta-inicial', 'Consulta inicial', 'Primera visita para conocerte y trazar un plan.', 'Una sesión pensada para la primera vez.', array['Evaluación personalizada','Plan a tu medida','Sin compromiso'], 60, 180000, '/img/service-consulta.svg', 'Espacio tranquilo para la consulta inicial', 800, 600),
  ('sesion-seguimiento', 'Sesión de seguimiento', 'Continuidad del plan acordado.', 'Para quienes ya iniciaron.', array['Seguimiento del progreso','Ajustes continuos'], 60, 140000, '/img/service-seguimiento.svg', 'Detalle de una sesión de seguimiento', 800, 600),
  ('sesion-extendida', 'Sesión extendida', 'Más tiempo para un trabajo a fondo.', 'El doble de tiempo para temas que requieren profundidad.', array['90 minutos','Trabajo en profundidad','Ideal para casos complejos'], 90, 250000, '/img/service-extendida.svg', 'Ambiente amplio para una sesión extendida', 800, 600)
) as v(id, name, summary, description, benefits, duration_minutes, price, image_url, image_alt, image_width, image_height)
where t.slug = 'default'
on conflict (tenant_id, id) do nothing;
