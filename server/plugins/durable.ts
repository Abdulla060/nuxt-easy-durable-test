import workerAdapter from "crossws/adapters/cloudflare";

export default defineNitroPlugin((nitroApp) => {
  const worker = workerAdapter(nitroApp.h3App.websocket);

  (nitroApp.h3App.websocket as any).resolveDurableStub = async (
    request: Request,
    env: any,
    context: any,
  ) => {
    const url = new URL(request.url);
    const route = await nitroApp.h3App.resolve(url.pathname);
    const instance = (route?.handler as any)?.instance;

    if (!instance)
      return {
        fetch: (req: Request) => worker.handleUpgrade(req, env, context),
      };
    return env.$DurableObject.get(env.$DurableObject.idFromName(instance(url)));
  };
});
