async function testModel(model) {
  try {
    const res = await fetch('https://chat-agent.hypelive.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hi', userId: 'test', model_override: model })
    });
    console.log(model, res.status);
  } catch(e) {
    console.log(model, 'error');
  }
}
