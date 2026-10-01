import { Client } from '@stomp/stompjs';

// Chat 페이지가 마운트되어 있는 동안 하나의 STOMP 연결을 재사용한다.
export function createChatClient(token: string): Client {
  const wsUrl = `${window.location.origin.replace(/^http/, 'ws')}/ws-chat`;

  return new Client({
    brokerURL: wsUrl,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });
}
