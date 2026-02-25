"use client"
import { AppStore, Store } from "@/store";
import { WorkerStats } from "@/types";
import { formatSize, time, withPost } from '@zuzjs/core';
import { useStore } from "@zuzjs/store";
import { Box, Cover, Spinner, Text, TRANSITION_CURVES, TRANSITIONS, useToast } from '@zuzjs/ui';
import { useParams } from 'next/navigation';
import React, { ReactNode, useEffect } from 'react';
import PageTitle from "../../page-title";

const StatBox = (props : { children: ReactNode | ReactNode[] }) => <Box as={`border:1,$background,solid p:$padding-md r:$radius-lg flex aic jcc cols gap:20`}>
        {props.children}
    </Box>

const Dashboard : React.FC = (_props) => {

    const { app } = useParams()
    const { loading: appLoading, dashboard, list, error, dispatch  } = useStore<typeof AppStore.Apps>(Store.Apps)
    const [ appId, section ] = app as Array<string>
    const currentApp = list.find(l => l.id == appId)
    const toast = useToast()

    const { loading: statsLoading, stats } = dashboard

    const loadData = (reload: boolean) => {
        dispatch({ dashboard: { loading: true, stats: reload ? stats : null } })
        withPost<{
            stats: WorkerStats | null
        }>(`/_/apps/dashboard`, {
            appId
        })
        .then(resp => {
            dispatch({ dashboard: { loading: false, stats: resp.stats } })
            setTimeout(() => loadData(true), 15_000)
        })
        .catch(err => {
            dispatch({ dashboard: { loading: false, stats: reload ? stats : null } })
            toast.error(err.message)
        })
    }

    useEffect(() => {
        document.title = `Dashboard`
        if ( currentApp ) loadData(false)
    }, [currentApp])


    

    return <Box as={`flex cols minH:100vh w:calc[100vw - 330px] p:$page-padding overflow-y`}>
        <PageTitle
            crumb={[
                { label: `Dashboard: ${currentApp?.name}`, link: `/app/${appId}/dashboard`, icon: `colorfilter` }
            ]}
            />


        <Spinner 
            fx={{
                transition: TRANSITIONS.SlideInRight,
                curve: TRANSITION_CURVES.Liquid,
                duration: 0.5,
                when: statsLoading || appLoading
            }}
            as={`abs top:20 right:30`} />

        <Box as={`flex flex:1 rel cols gridGap:20 grid grid-cols:repeat[3, 1fr] rel`}>

            <Cover when={appLoading} />

            <StatBox>
                <Text as={`s:sm`}>Worker</Text>
                <Text as={`s:lg bold`}>{stats?.name ?? `..`}</Text>
            </StatBox>

            <StatBox>
                <Text as={`s:sm`}>Status</Text>
                <Text as={`s:lg bold`}>{stats?.status ?? `..`}</Text>
            </StatBox>

            <StatBox>
                <Text as={`s:sm`}>Uptime</Text>
                <Text as={`s:lg bold`}>{stats ? time(stats?.uptime!, `hh:mm:ss`) : `..`}</Text>
            </StatBox>

            <StatBox>
                <Text as={`s:sm`}>Restart Count</Text>
                <Text as={`s:lg bold`}>{stats?.restartCount ?? `..`}</Text>
            </StatBox>

            <StatBox>
                <Text as={`s:sm`}>CPU Usage</Text>
                <Text as={`s:lg bold`}>{stats ? `${stats.cpu!}%` : `..`}</Text>
            </StatBox>

            <StatBox>
                <Text as={`s:sm`}>Memory Usage</Text>
                <Text as={`s:lg bold`}>{stats ? formatSize(stats.memoryRss!) : `..`}</Text>
            </StatBox>

        </Box>    

    </Box>
}

export default Dashboard;