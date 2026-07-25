import webPush from "web-push";

export class WebPushProvider {
  constructor(subject: string, publicKey: string, privateKey: string) {
    webPush.setVapidDetails(subject, publicKey, privateKey);
  }
  async send(subscription: { endpoint: string; p256dh: string; auth: string }, payload: unknown) {
    const response = await webPush.sendNotification({
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    }, JSON.stringify(payload));
    return { provider: "web-push", statusCode: response.statusCode };
  }
}
