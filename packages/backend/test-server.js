import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await server.listen({ host: '0.0.0.0', port: 3001 });
    console.log('✅ Servidor de prueba corriendo en http://localhost:3001');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

start();
