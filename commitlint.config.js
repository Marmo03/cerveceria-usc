module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Corrección de bug
        'docs',     // Cambios en documentación
        'style',    // Cambios de formato (sin afectar lógica)
        'refactor', // Refactorización de código
        'perf',     // Mejoras de rendimiento
        'test',     // Añadir o corregir tests
        'build',    // Cambios en build system o deps externas
        'ci',       // Cambios en configuración CI
        'chore',    // Tareas de mantenimiento
        'revert',   // Revertir cambios
        'wip',      // Work in progress (solo para desarrollo)
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'frontend',   // Cambios en Vue.js
        'backend',    // Cambios en Fastify/Prisma
        'database',   // Cambios en esquema de BD
        'docker',     // Cambios en containerización
        'n8n',       // Cambios en automatización
        'ci',        // Cambios en CI/CD
        'docs',      // Documentación general
        'p2p',       // Metodología P2P
        'adr',       // Architecture Decision Records
        'config',    // Configuración general
        'deps',      // Dependencias
        'tests',     // Testing
        'auth',      // Autenticación/autorización
        'api',       // API específicamente
        'ui',        // Interfaz de usuario
        'db',        // Base de datos
        'infra',     // Infraestructura
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 72],
  },
  prompt: {
    questions: {
      type: {
        description: "Selecciona el tipo de cambio que estás realizando:",
        enum: {
          feat: {
            description: '🚀 Nueva funcionalidad',
            title: 'Funcionalidades',
            emoji: '🚀',
          },
          fix: {
            description: '🐛 Corrección de bug',
            title: 'Correcciones',
            emoji: '🐛',
          },
          docs: {
            description: '📚 Cambios en documentación',
            title: 'Documentación',
            emoji: '📚',
          },
          style: {
            description: '💎 Cambios de formato (sin afectar lógica)',
            title: 'Estilos',
            emoji: '💎',
          },
          refactor: {
            description: '📦 Refactorización de código',
            title: 'Refactoring',
            emoji: '📦',
          },
          perf: {
            description: '🚀 Mejoras de rendimiento',
            title: 'Performance',
            emoji: '🚀',
          },
          test: {
            description: '🚨 Añadir o corregir tests',
            title: 'Tests',
            emoji: '🚨',
          },
          build: {
            description: '🛠 Cambios en build system o deps externas',
            title: 'Build',
            emoji: '🛠',
          },
          ci: {
            description: '⚙️ Cambios en configuración CI',
            title: 'CI',
            emoji: '⚙️',
          },
          chore: {
            description: '♻️ Tareas de mantenimiento',
            title: 'Chores',
            emoji: '♻️',
          },
          revert: {
            description: '🗑 Revertir cambios',
            title: 'Reverts',
            emoji: '🗑',
          },
        },
      },
      scope: {
        description: 'Cuál es el alcance de este cambio (opcional):',
      },
      subject: {
        description: 'Escribe una descripción corta e imperativa del cambio:',
      },
      body: {
        description: 'Proporciona una descripción más detallada del cambio (opcional):',
      },
      isBreaking: {
        description: '¿Hay algún cambio que rompe compatibilidad?',
      },
      breakingBody: {
        description: 'Un commit con BREAKING CHANGE requiere un cuerpo. Por favor ingresa una descripción más larga del commit:',
      },
      breaking: {
        description: 'Describe los cambios que rompen compatibilidad:',
      },
      isIssueAffected: {
        description: '¿Este cambio afecta algún issue abierto?',
      },
      issuesBody: {
        description: 'Si los issues se cierran, el commit requiere un cuerpo. Por favor ingresa una descripción más larga del commit:',
      },
      issues: {
        description: 'Agrega referencias de issues (ej. "fix #123", "re #123"):',
      },
    },
  },
};