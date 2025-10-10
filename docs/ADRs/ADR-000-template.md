# ADR-000: [Título de la Decisión Arquitectónica]

**Estado**: [Propuesto | Aceptado | Rechazado | Deprecado | Supersedido por ADR-XXX]
**Fecha**: YYYY-MM-DD
**Autores**: @desarrollador1, @desarrollador2
**Revisores**: @arquitecto, @team-lead

---

## 📋 Resumen

<!-- Breve descripción de la decisión arquitectónica en 1-2 párrafos -->

**TL;DR**: [Resumen ejecutivo en una oración de la decisión tomada]

---

## 🎯 Contexto y Problema

### 🤔 ¿Cuál es el problema?
<!-- Describe el problema o la necesidad que motiva esta decisión -->

### 🌍 Contexto del Negocio
<!-- Contexto específico del proyecto Cervecería USC -->
- **Módulo afectado**: [Frontend / Backend / Base de datos / Infraestructura / n8n]
- **Funcionalidad**: [Qué funcionalidad del sistema se ve afectada]
- **Usuarios impactados**: [Quién se ve afectado por esta decisión]

### 🎯 Objetivos
<!-- Qué objetivos debe cumplir la solución -->
- **Objetivo principal**: [Objetivo primario]
- **Objetivos secundarios**: 
  - [Objetivo 1]
  - [Objetivo 2]

### 📊 Restricciones y Limitaciones
<!-- Limitaciones técnicas, de tiempo, presupuesto, etc. -->
- **Técnicas**: [Limitaciones de la tecnología actual]
- **Tiempo**: [Constraints de tiempo del proyecto]
- **Recursos**: [Limitaciones de equipo o conocimiento]
- **Compatibilidad**: [Requisitos de compatibilidad]

---

## 🔍 Alternativas Consideradas

### 🚀 Opción 1: [Nombre de la Opción]
**Descripción**: [Descripción detallada de la alternativa]

**Pros**:
- ✅ [Ventaja 1]
- ✅ [Ventaja 2]
- ✅ [Ventaja 3]

**Contras**:
- ❌ [Desventaja 1]
- ❌ [Desventaja 2]
- ❌ [Desventaja 3]

**Esfuerzo estimado**: [Alto / Medio / Bajo]
**Riesgo**: [Alto / Medio / Bajo]

### 🚀 Opción 2: [Nombre de la Opción]
**Descripción**: [Descripción detallada de la alternativa]

**Pros**:
- ✅ [Ventaja 1]
- ✅ [Ventaja 2]

**Contras**:
- ❌ [Desventaja 1]
- ❌ [Desventaja 2]

**Esfuerzo estimado**: [Alto / Medio / Bajo]
**Riesgo**: [Alto / Medio / Bajo]

### 🚀 Opción 3: [Nombre de la Opción - ELEGIDA]
**Descripción**: [Descripción detallada de la alternativa elegida]

**Pros**:
- ✅ [Ventaja 1]
- ✅ [Ventaja 2]

**Contras**:
- ❌ [Desventaja 1]
- ❌ [Desventaja 2]

**Esfuerzo estimado**: [Alto / Medio / Bajo]
**Riesgo**: [Alto / Medio / Bajo]

---

## ✅ Decisión

### 🎯 Decisión Tomada
**Elegimos la Opción [X]: [Nombre de la opción elegida]**

### 🤔 Justificación
<!-- Por qué se eligió esta opción sobre las otras -->

**Factores decisivos**:
1. **[Factor 1]**: [Explicación de por qué este factor fue importante]
2. **[Factor 2]**: [Explicación]
3. **[Factor 3]**: [Explicación]

**Trade-offs aceptados**:
- **Sacrificamos**: [Qué estamos sacrificando]
- **Para obtener**: [Qué beneficio priorizamos]

### 👥 Proceso de Decisión
<!-- Cómo se llegó a esta decisión -->
- **Investigación**: [Qué investigación se realizó]
- **Consenso del equipo**: [Cómo se alcanzó el consenso]
- **Validación**: [Cómo se validó la decisión]

---

## 🏗️ Implementación

### 📋 Plan de Implementación
<!-- Pasos concretos para implementar la decisión -->

**Fase 1: Preparación**
- [ ] [Tarea 1]
- [ ] [Tarea 2]
- [ ] [Tarea 3]

**Fase 2: Desarrollo**
- [ ] [Tarea 1]
- [ ] [Tarea 2]
- [ ] [Tarea 3]

**Fase 3: Despliegue**
- [ ] [Tarea 1]
- [ ] [Tarea 2]

### 📊 Criterios de Aceptación
<!-- Cómo sabremos que la implementación fue exitosa -->
- [ ] **[Criterio 1]**: [Descripción medible]
- [ ] **[Criterio 2]**: [Descripción medible]
- [ ] **[Criterio 3]**: [Descripción medible]

### ⏰ Timeline
- **Inicio**: [Fecha]
- **Hitos importantes**: 
  - [Fecha]: [Hito 1]
  - [Fecha]: [Hito 2]
- **Finalización esperada**: [Fecha]

### 👥 Responsabilidades
- **Implementación**: @desarrollador1, @desarrollador2
- **Revisión**: @arquitecto
- **Testing**: @qa-engineer
- **Documentación**: @tech-writer

---

## 🔄 Impacto y Consecuencias

### 🎯 Impacto Positivo
<!-- Beneficios esperados de la decisión -->
- **Performance**: [Cómo mejora el rendimiento]
- **Mantenibilidad**: [Cómo facilita el mantenimiento]
- **Escalabilidad**: [Cómo mejora la escalabilidad]
- **Developer Experience**: [Cómo mejora la experiencia de desarrollo]

### ⚠️ Impacto Negativo
<!-- Posibles consecuencias negativas -->
- **Complejidad**: [Qué complejidad se añade]
- **Deuda técnica**: [Qué deuda técnica se genera]
- **Riesgos**: [Qué riesgos se introducen]

### 🔄 Cambios Requeridos
<!-- Qué debe cambiar en el sistema actual -->

**Código**:
- Frontend: [Cambios necesarios en Vue.js]
- Backend: [Cambios necesarios en Fastify]
- Base de datos: [Cambios en Prisma/PostgreSQL]

**Infraestructura**:
- Docker: [Cambios en containerización]
- CI/CD: [Cambios en pipelines]
- Monitoring: [Cambios en monitoreo]

**Documentación**:
- [ ] Actualizar README
- [ ] Actualizar documentación técnica
- [ ] Crear guías de implementación

**Testing**:
- [ ] Nuevos tests unitarios
- [ ] Tests de integración
- [ ] Tests de performance

---

## 📊 Métricas y Monitoreo

### 📈 Métricas de Éxito
<!-- Cómo mediremos si la decisión fue correcta -->
- **[Métrica 1]**: [Valor actual] → [Valor objetivo]
- **[Métrica 2]**: [Valor actual] → [Valor objetivo]
- **[Métrica 3]**: [Valor actual] → [Valor objetivo]

### 🔍 Monitoreo
<!-- Qué monitorearemos para validar la decisión -->
- **Performance**: [Qué métricas de performance]
- **Errores**: [Qué errores específicos]
- **Uso**: [Qué patrones de uso]

### 📅 Revisión
- **Fecha de revisión**: [Cuándo revisaremos los resultados]
- **Responsable de revisión**: @usuario
- **Criterios para considerar cambios**: [Qué condiciones llevarían a reconsiderar]

---

## 🔗 Referencias y Enlaces

### 📚 Documentación Técnica
- [Título](URL) - [Descripción]
- [Título](URL) - [Descripción]

### 🎯 Issues y PRs Relacionados
- Issue #[número]: [Descripción]
- PR #[número]: [Descripción]

### 📖 ADRs Relacionados
- ADR-[número]: [Título] - [Relación]
- ADR-[número]: [Título] - [Relación]

### 🌐 Referencias Externas
- [Artículo/Blog](URL) - [Por qué es relevante]
- [Documentación oficial](URL) - [Sección específica]

---

## 📝 Notas Adicionales

### 🔮 Trabajo Futuro
<!-- Qué trabajo adicional podría ser necesario -->
- [Elemento de trabajo futuro 1]
- [Elemento de trabajo futuro 2]

### 🎓 Lecciones Aprendidas (Post-implementación)
<!-- Sección para completar después de la implementación -->
- **¿Qué funcionó bien?**: [Para completar después]
- **¿Qué no funcionó como esperábamos?**: [Para completar después]
- **¿Qué haríamos diferente?**: [Para completar después]

### 💬 Comentarios del Equipo
<!-- Espacio para que el equipo añada comentarios -->

---

## 📋 Checklist de Revisión

### ✅ Antes de Aprobar
- [ ] Problema claramente definido
- [ ] Alternativas evaluadas exhaustivamente
- [ ] Decisión justificada con criterios claros
- [ ] Plan de implementación detallado
- [ ] Impactos identificados y documentados
- [ ] Métricas de éxito definidas
- [ ] Referencias incluidas
- [ ] Revisado por arquitecto/tech lead
- [ ] Consenso del equipo

### ✅ Durante Implementación
- [ ] Plan de implementación seguido
- [ ] Criterios de aceptación validados
- [ ] Tests implementados y pasando
- [ ] Documentación actualizada
- [ ] Métricas siendo monitoreadas

### ✅ Post-implementación
- [ ] Resultados medidos contra objetivos
- [ ] Lecciones aprendidas documentadas
- [ ] Impactos reales vs esperados analizados
- [ ] Próximos pasos identificados

---

**🏷️ Tags**: #adr #arquitectura #cerveceria-usc #[componente] #[tecnología]

**📅 Historia**:
- YYYY-MM-DD: Creado por @autor
- YYYY-MM-DD: Revisado por @revisor
- YYYY-MM-DD: Aprobado por @aprobador
- YYYY-MM-DD: Implementado
- YYYY-MM-DD: Revisado post-implementación

---
*ADR parte del proyecto Cervecería USC | Metodología P2P | Universidad USC*