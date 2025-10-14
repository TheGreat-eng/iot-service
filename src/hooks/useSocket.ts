// src/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080';

export const useSocket = (farmId: number) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Kết nối tới WebSocket server khi component được mount
        const newSocket = io(WS_URL, {
            path: '/ws/socket.io' // Cần path này vì backend dùng Spring SockJS
        });
        setSocket(newSocket);

        // Gửi thông điệp đăng ký nhận tin từ farm cụ thể khi kết nối thành công
        newSocket.on('connect', () => {
            console.log('✅ WebSocket Connected!');
            // Backend Spring không cần subscribe qua socket emit, mà qua STOMP.
            // Ta sẽ xử lý subscribe STOMP trong component.
        });

        // Ngắt kết nối khi component unmount
        return () => {
            newSocket.disconnect();
        };
    }, [farmId]);

    return socket;
};