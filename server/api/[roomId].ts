import type { Peer } from "crossws";

// The name is in the socket's URL, which crossws keeps on the socket, so it's still there after hibernation.
const nameOf = (peer: Peer) =>
  new URL(peer.request.url).searchParams.get("name")?.trim().slice(0, 32) ||
  "Anonymous";

const sendAll = (peers: Peer[], data: unknown) => {
  const message = JSON.stringify(data);
  for (const peer of peers) {
    try {
      peer.send(message);
    } catch {
      // the socket is closing; its close hook updates the others
    }
  }
};

const sendPeers = (peers: Peer[]) =>
  sendAll(peers, {
    type: "peers",
    peers: peers.map((peer) => ({ id: peer.id, name: nameOf(peer) })),
  });

export default defineDurableHandler(
  (url) => `room:${url.pathname.split("/").pop()}`,
  {
    open(peer) {
      // crossws calls open before the Durable Object has answered the upgrade, so send just after
      setTimeout(() => sendPeers([...peer.peers]), 0);
    },
    message(peer, message) {
      sendAll([...peer.peers], {
        type: "message",
        name: nameOf(peer),
        text: message.text(),
      });
    },
    close(peer) {
      // the closing socket can still be listed here
      sendPeers([...peer.peers].filter((other) => other.id !== peer.id));
    },
  },
);
