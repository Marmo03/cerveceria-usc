# 🔄 Pull Request - Cervecería USC

## 📝 Descripción
<!-- Describe de manera clara y concisa qué cambios introduces -->

### ✨ Tipo de cambio
<!-- Marca con "x" el tipo de cambio que aplica -->
- [ ] 🐛 Bug fix (corrección que soluciona un problema)
- [ ] ✨ Nueva funcionalidad (cambio que añade funcionalidad)
- [ ] 💥 Breaking change (corrección o funcionalidad que causa que funcionalidad existente no funcione como se esperaba)
- [ ] 📚 Documentación (cambios solo en documentación)
- [ ] 🔧 Refactoring (cambio que no corrige un bug ni añade funcionalidad)
- [ ] ⚡ Mejora de rendimiento
- [ ] 🧪 Tests (añadir tests faltantes o corregir tests existentes)
- [ ] 🔨 Build/CI (cambios en scripts de build o configuración CI)
- [ ] ♻️ Chore (otros cambios que no modifican src o test files)

### 🎯 Scope
<!-- Marca con "x" las áreas afectadas -->
- [ ] 🖥️ Frontend (Vue.js)
- [ ] ⚙️ Backend (Fastify/Prisma)
- [ ] 🗄️ Base de datos (Prisma schema/migrations)
- [ ] 🐳 Docker/Infra
- [ ] 🤖 n8n (Automatización)
- [ ] 📋 CI/CD
- [ ] 📖 Documentación
- [ ] 🧪 Tests

## 🔗 Issues relacionados
<!-- Enlaza los issues que este PR cierra o está relacionado -->
- Closes #(issue number)
- Related to #(issue number)

## 📸 Screenshots (si aplica)
<!-- Añade screenshots para cambios en UI -->

| Antes | Después |
|-------|---------|
|   -   |    -    |

## 🧪 Testing
<!-- Describe las pruebas que realizaste -->

### ✅ Tests realizados
- [ ] 🧪 Tests unitarios pasan
- [ ] 🔍 Tests de integración pasan
- [ ] 👤 Tests de usuario/e2e pasan
- [ ] 🔍 Code review por pares
- [ ] 🖥️ Probado en desarrollo local
- [ ] 🌐 Probado en diferentes navegadores (si aplica)
- [ ] 📱 Probado responsive (si aplica)

### 🔧 Instrucciones para probar
```bash
# Pasos para reproducir/probar los cambios
1. npm run docker:up
2. npm install
3. npm run dev
4. Navegar a...
5. Realizar acción...
```

## 📋 Checklist
<!-- Marca todos los elementos que apliquen antes de solicitar review -->

### 🏗️ Código
- [ ] Mi código sigue los estándares del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado mi código en partes difíciles de entender
- [ ] He hecho los cambios correspondientes en la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He añadido tests que prueban que mi fix es efectivo o que mi feature funciona
- [ ] Tests nuevos y existentes pasan localmente

### 📚 Documentación
- [ ] He actualizado README si es necesario
- [ ] He actualizado documentación técnica si es necesario
- [ ] He creado/actualizado ADR si es una decisión arquitectónica importante
- [ ] He actualizado bitácora P2P correspondiente

### 🔄 Metodología P2P
- [ ] He registrado el progreso en bitácora diaria
- [ ] He documentado colaboración/pair programming si aplica
- [ ] He solicitado peer review
- [ ] He incluido evidencia de testing colaborativo

### 🔐 Seguridad
- [ ] No he expuesto credenciales o información sensible
- [ ] He revisado dependencias por vulnerabilidades conocidas
- [ ] He validado inputs si aplica
- [ ] He aplicado principios de menor privilegio si aplica

## 📊 Performance
<!-- Si aplica, describe el impacto en performance -->
- [ ] No hay impacto negativo en performance
- [ ] Hay mejoras de performance (describir abajo)
- [ ] Cambios pueden afectar performance (describir abajo y justificar)

**Detalles de performance:**

## 🌟 Información adicional
<!-- Cualquier información adicional que los reviewers deberían saber -->

### 🤔 Decisiones tomadas
<!-- Explica decisiones importantes que tomaste y por qué -->

### 🚨 Breaking Changes
<!-- Si hay breaking changes, descríbelos aquí -->

### 📝 Notas para el reviewer
<!-- Información específica para quien va a revisar el código -->

### 🔮 Trabajo futuro
<!-- Menciona trabajo que quedó pendiente o mejoras futuras -->

---

## 👥 Para el Reviewer

### 🔍 Puntos a revisar especialmente
- [ ] Lógica de negocio
- [ ] Seguridad
- [ ] Performance
- [ ] Testing
- [ ] Documentación
- [ ] Arquitectura/Diseño

### ✅ Approval Checklist
- [ ] Código revisado y aprobado
- [ ] Tests ejecutados y pasan
- [ ] Documentación revisada
- [ ] No hay conflictos de merge
- [ ] Branch actualizada con main/develop

---

**🎓 Metodología P2P:** Este PR fue desarrollado siguiendo metodología P2P con peer review y documentación colaborativa.

**📅 Fecha:** <!-- Fecha de creación del PR -->
**👤 Desarrolladores:** <!-- @usuario1, @usuario2 -->
**🕐 Tiempo estimado de review:** <!-- ej: 30 minutos -->