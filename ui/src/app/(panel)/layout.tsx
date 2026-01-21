"use client"
import { Box, Text } from '@zuzjs/ui';
import React, { ReactNode, Suspense } from 'react';
import { AppStore, Store } from "@/store";
import createStore from "@zuzjs/store";
import Authenticate from '@/app/oauth';
import Sidebar from './sidebar';

const PanelLayout = ({ children, }: Readonly<{ children: React.ReactNode; }>) => {

    const { Provider: AppsProvider } = createStore(Store.Apps, AppStore.Apps)
    const { Provider: FileManagerProvider } = createStore(Store.FileManager, AppStore.FileManager)
    const { Provider: NginxProvider } = createStore(Store.Nginx, AppStore.Nginx)

    return <AppsProvider>
        <FileManagerProvider>
            <NginxProvider>
                <Suspense>
                    <Authenticate redirect={true} />
                </Suspense>
                <Sidebar />
                <Box as={`w:calc[100vw - 60px] flex cols h:100vh overflowX:hidden overflowY:auto`}>
                    {children}
                </Box>
            </NginxProvider>
        </FileManagerProvider>
    </AppsProvider>
}

export default PanelLayout;