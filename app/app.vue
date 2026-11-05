<script setup lang="ts">
type ChatPeer = { id: string; name: string };
type ChatMessage = { name: string; text: string };

const room = ref("general");
const name = ref("");
const draft = ref("");
const messages = ref<ChatMessage[]>([]);
const peers = ref<ChatPeer[]>([]);
const socket = ref<WebSocket>();
const connectedRoom = ref<string>();

const join = () => {
  socket.value?.close();
  messages.value = [];
  peers.value = [];
  connectedRoom.value = undefined;

  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const joiningRoom = room.value;
  const params = new URLSearchParams({ name: name.value });
  const ws = new WebSocket(
    `${protocol}://${location.host}/api/${encodeURIComponent(joiningRoom)}?${params}`,
  );
  socket.value = ws;

  ws.onopen = () => {
    if (socket.value === ws) connectedRoom.value = joiningRoom;
  };
  ws.onmessage = (event) => {
    if (socket.value !== ws) return;
    const data = JSON.parse(event.data);
    if (data.type === "peers") peers.value = data.peers;
    if (data.type === "message") messages.value.push(data);
  };
  ws.onclose = () => {
    if (socket.value !== ws) return;
    socket.value = undefined;
    connectedRoom.value = undefined;
    peers.value = [];
  };
};

const send = () => {
  if (!draft.value) return;
  socket.value?.send(draft.value);
  draft.value = "";
};

onBeforeUnmount(() => socket.value?.close());
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />

    <form @submit.prevent="join">
      <input v-model="name" placeholder="Your name" required />
      <input v-model="room" placeholder="Room" required />
      <button>Join</button>
      <span id="status">{{
        connectedRoom ? ` Connected to ${connectedRoom}` : " Not connected"
      }}</span>
    </form>

    <h3>Peers ({{ peers.length }})</h3>
    <ul id="peers">
      <li v-for="peer in peers" :key="peer.id">{{ peer.name }}</li>
    </ul>

    <h3>Messages</h3>
    <form @submit.prevent="send">
      <input v-model="draft" placeholder="Message" :disabled="!connectedRoom" />
      <button :disabled="!connectedRoom">Send</button>
    </form>

    <ul id="messages">
      <li v-for="(message, i) in messages" :key="i">
        {{ message.name }}: {{ message.text }}
      </li>
    </ul>
  </div>
</template>
