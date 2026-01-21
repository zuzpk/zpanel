"use client"
import { Box, Spinner, SPINNER, Table, Text, useToast } from '@zuzjs/ui';
import React, { useCallback, useEffect } from 'react';
import { useStore } from "@zuzjs/store"
import { AppStore, Store } from '@/store';
import { withPost } from '@zuzjs/core';
import { ZuzApp, ZuzAppStatus } from '../../../types';
import AppItem from './item';
import PageTitle from '../page-title';
import { useRouter } from "next/navigation"
import Error from '@/app/error';

const Page : React.FC = (_props) => {
    
    const { loading: youLoading, ID, nm, ir } = useStore<typeof AppStore.User>(Store.User)
    const { dispatch, loading, list } = useStore<typeof AppStore.Apps>(Store.Apps)
    const router = useRouter()
    const toast = useToast()

    const loadApps = useCallback(async () => {
        withPost<{
            kind: string;
            apps: ZuzApp[];
        }>(`/_/apps/list`, {})
            .then(resp => {
                dispatch({
                    loading: false,
                    list: resp.apps
                })
            })
            .catch(error => {
                dispatch({ loading: false, error: error.reason || error.message || `Failed to load apps` })
            })
    }, [])

    const updateAppInStore = useCallback((updatedApp: ZuzApp) => {
        dispatch({ 
            list: list.map(app => {
                if ( app.id == updatedApp.id ) {
                    return updatedApp
                }
                return app
            }) 
        })
    }, [list])

    const appAction = useCallback(async ( aid: string, mod: `start` | `stop` | `restart` ) => {

        const _App = list.find(app => app.id == aid)!
        
        if ( !_App ){
            toast.error(`App not found`)
            return
        }

        updateAppInStore({
            ..._App,
            status: ZuzAppStatus.Loading
        })
        
        withPost<{
            status: ZuzAppStatus,
            message?: string
        }>(`/_/apps/${mod}`, { id: aid })
        .then(resp => {
            toast.success(resp.message || `App ${mod}ed successfully`)
            updateAppInStore({
                ..._App,
                status: resp.status
            })
        })
        .catch((e: any) => {
            toast.error(e.message || `Failed to ${mod} app`)
            updateAppInStore({
                ..._App
            })
        })

    }, [list])

    useEffect(() => {
        window.document.title = `Apps`
        loadApps()
    }, [youLoading])

    return <Box as={`flex cols p:$page-padding`}>
        <PageTitle 
            crumb={[
                {
                    label: `Apps`,
                    icon: `box`
                }
            ]}
            actions={[
                {
                    label: `Create App`,
                    fn: () => {
                        router.push(`/apps/create`)
                    }
                }
            ]} />

        
            {loading || ID == -1 ? null 
            : list.length > 0 ? 
                <Box as={[ `grid grid-cols:repeat[5,1fr] gap:20` ]}>
                    {list.map((app: ZuzApp, index: number) => <AppItem 
                        meta={app} 
                        index={index} 
                        fun={appAction}
                        key={`app-item-${index}-${app.id}`} />)
                    }</Box>
            : <Error 
                code={`empty-here`}     
                title={`You have not added any app`} 
                message={`Click \`Create App\` to add an app to get started.`} />}

    </Box>
}

export default Page;