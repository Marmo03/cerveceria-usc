# Configuración de Protección de Branch en GitHub

## Paso 1: Acceder a la Configuración del Repositorio

1. Ve a tu repositorio: https://github.com/Marmo03/cerveceria-usc
2. Haz clic en "Settings" (en la barra superior del repositorio)
3. En el menú lateral izquierdo, haz clic en "Branches"

## Paso 2: Agregar Regla de Protección para Main

1. Haz clic en "Add rule" o "Add branch protection rule"
2. En "Branch name pattern" escribe: `main`

## Paso 3: Configurar las Siguientes Opciones

### Protecciones Básicas

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners

### Verificaciones de Estado

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - En el campo de búsqueda, agregar estos checks cuando estén disponibles:
    - `ci / lint`
    - `ci / test-frontend`
    - `ci / test-backend`
    - `ci / build-frontend`
    - `ci / build-backend`

### Restricciones Adicionales

- ✅ **Require conversation resolution before merging**
- ✅ **Restrict pushes that create files**
- ❌ Allow force pushes (NO marcar)
- ❌ Allow deletions (NO marcar)

### Reglas para Administradores

- ❌ Do not allow bypassing the above settings (NO marcar para que tú como admin puedas hacer cambios si es necesario)

## Paso 4: Guardar la Configuración

1. Haz scroll hacia abajo
2. Haz clic en "Create" o "Save changes"

## Paso 5: Configurar Branch por Defecto (Opcional)

1. En la misma página "Branches"
2. En la sección "Default branch"
3. Asegúrate de que esté seleccionado "main"
4. Si no lo está, haz clic en el ícono de cambio y selecciona "main"

## Resultado Final

Una vez configurado:

- Nadie puede hacer push directo a `main`
- Todos los cambios deben pasar por Pull Request
- Los PRs requieren al menos 1 aprobación
- Los PRs deben pasar todas las verificaciones de CI
- Las conversaciones deben resolverse antes del merge

## Verificación

Para verificar que funciona:

1. Intenta hacer push directo a main (debería fallar)
2. Crea un PR desde otra branch hacia main
3. Verifica que pida aprobación antes de permitir merge

## Configuración Adicional Recomendada

### Para la branch `develop` (opcional):

- Repetir el proceso pero con reglas más relajadas
- Solo requerir que pasen los status checks
- No requerir aprobaciones (para desarrollo más ágil)

### Configurar Rulesets (GitHub Pro):

Si tienes GitHub Pro o superior, puedes usar "Rulesets" en lugar de branch protection rules para configuraciones más avanzadas.
