"use client"
import { pubsub } from '@/cache';
import { PubEvent } from '@/types';
import { Box, Cover, Terminal, TerminalHandler } from '@zuzjs/ui';
import React, { memo, useEffect, useRef, useState } from 'react';
import { terminalService } from './service'; // Import the singleton

const ZuzTerminal: React.FC<{
    autoStart?: boolean,
    appId?: string,
    maxHeight?: string
}> = ({
    appId,
    maxHeight = `50vh`
}) => {
    const terminalRef = useRef<TerminalHandler>(null);
    const [isConnected, setIsConnected] = useState<boolean>(true);

    useEffect(() => {
        // 1. Link this specific mount's ref to the Singleton
        if (terminalRef.current) {
            terminalService.setHandler(terminalRef.current);
        }

        // 2. Define our bridge function
        const handleLog = (msg: string) => {
            terminalService.write(msg);
        };

        const handleStatus = (status: boolean) => {
            setIsConnected(status);
        };

        // 3. Subscribe to events
        pubsub.on(PubEvent.OnTLog, handleLog);
        pubsub.on(PubEvent.OnSocketStatusChange, handleStatus);
        
        // Signal connection for this appId
        pubsub.emit(PubEvent.ConnectTLog, appId ?? "-");

        return () => {
            // Cleanup: Detach handler so we don't try to write to an unmounted ref
            pubsub.off(PubEvent.OnTLog, handleLog);
            pubsub.off(PubEvent.OnSocketStatusChange, handleStatus);
            terminalService.setHandler(null);
        };
    }, [appId]); // Re-run only if appId changes

    return (
        <Box as={`rel`} style={{ '--terminal-max-height' : maxHeight }}>
            <Cover when={!isConnected} />
            <Box>
                <Terminal ref={terminalRef} />
            </Box>
        </Box>
    );
}

export default memo(ZuzTerminal);