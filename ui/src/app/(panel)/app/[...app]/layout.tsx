"use client"
import { Box, SPINNER, Spinner, Text } from '@zuzjs/ui';
import { AppStore, Store } from "@/store";
import createStore from "@zuzjs/store";
import React, { Suspense, lazy, useMemo } from 'react'
import { useParams, useSelectedLayoutSegment } from 'next/navigation'

import Sidebar from "./sidebar";
import Error from '@/app/error';

const Dashboard = lazy(() => import('./dashboard'));
const Logs = lazy(() => import('./logs'));
const SourceCode = lazy(() => import('./source'));
const Settings = lazy(() => import('./settings'));

export const sectionComponents: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  logs: Logs,
  source: SourceCode,
  setting: Settings,
  '': Dashboard,           // ← optional: fallback
}

const DetailLayout = ({ children, }: Readonly<{ children: React.ReactNode; }>) => {

    const { Provider: AppsProvider } = createStore(Store.Apps, AppStore.Apps)
    const { app } = useParams()
    const [ id, section ] = app

    const CurrentSection = useMemo(() => {
        return sectionComponents[section] || sectionComponents[''] || (() => (
            <Error title={`Section not found: ${section}`} />
        ))
    }, [section])

    return <Box as={`flex cols h:100vh w:calc[100vw - 60] no-overflow`}>
        <Box as={`flex w:100vw flex:1 minH:0`}>
            <Sidebar />
            <Box as={`flex:1 w:calc[100vw - 270px] h:full overflowX:hidden overflowY:auto bg:$dim-light r:30,0,0,30`}>
                <Suspense fallback={<Spinner as={`abs abc`} /> }>
                    <CurrentSection />
                </Suspense>
            </Box>
        </Box>
        
    </Box>
}

export default DetailLayout;