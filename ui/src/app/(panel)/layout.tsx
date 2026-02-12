"use client"
import { Box, Text, LayersProvider} from '@zuzjs/ui';
import React, { ReactNode, Suspense, useEffect, useRef } from 'react';
import { AppStore, Store } from "@/store";
import createStore from "@zuzjs/store";
import Authenticate from '@/app/oauth';
import Sidebar from './sidebar';
import { useWebSocket } from '@zuzjs/hooks';
import { WSS_URL_TERMINAL } from '@/config';
import { pubsub } from '@/cache';
import { PubEvent } from '@/types';

const PanelLayout = ({ children, }: Readonly<{ children: React.ReactNode; }>) => {

    const { Provider: AppsProvider } = createStore(Store.Apps, AppStore.Apps)
    const { Provider: FileManagerProvider } = createStore(Store.FileManager, AppStore.FileManager)
    const { Provider: NginxProvider } = createStore(Store.Nginx, AppStore.Nginx)
    const { Provider: GitProvider } = createStore(Store.Git, AppStore.Git)

    const lastConnected = useRef<boolean>(false)

    const { isConnected, messages, sendMessage } = useWebSocket(
        WSS_URL_TERMINAL,
        {
            onMessage: (e) => {
                if ( e.a == `tlog` ) {
                    pubsub.emit(PubEvent.OnTLog, e.m.msg);
                }
            },
            onOpen: () => {
                sendMessage({ a: "tlog", m: "-" });
            }
        }
    );

    useEffect(() => {
        pubsub.on(PubEvent.ConnectTLog, (appId: string) => {
            if ( isConnected){
                pubsub.emit(PubEvent.OnSocketStatusChange, isConnected);
                sendMessage({ a: "tlog", m: appId });
            }
        })
    }, [])

    useEffect(() => {
        if ( isConnected != lastConnected.current ) {
            lastConnected.current = isConnected;
            pubsub.emit(PubEvent.OnSocketStatusChange, isConnected);
        }
    }, [isConnected])


    return <AppsProvider>
        <FileManagerProvider>
            <NginxProvider>
                <GitProvider>
                    <LayersProvider>
                        <Suspense>
                            <Authenticate redirect={true} />
                        </Suspense>
                        <Sidebar />
                        <Box as={`w:calc[100vw - 60px] flex cols h:100vh overflowX:hidden overflowY:auto`}>
                            {children}
                        </Box>
                    </LayersProvider>
                </GitProvider>
            </NginxProvider>
        </FileManagerProvider>
    </AppsProvider>
}

export default PanelLayout;