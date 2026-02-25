"use client"
import { AppStore, Store } from '@/store';
import { AppSwitchMode, LinuxUser, ZuzApp, ZuzAppStatus } from '@/types';
import { dynamic, withPost } from '@zuzjs/core';
import { useDelayed } from '@zuzjs/hooks';
import { useStore } from '@zuzjs/store';
import { Box, Button, css, Icon, Spinner, Text, useDialog, useToast, Variant } from '@zuzjs/ui';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { sectionComponents } from './layout';

const Sidebar : React.FC = (_props) => {

    const { app } = useParams()
    const [ id, section ] = app as string[]
    const pathName = usePathname()
    const when = useDelayed()
    const { loading, error, users, list, dispatch  } = useStore<typeof AppStore.Apps>(Store.Apps)
    const currentSection = useMemo(() => sectionComponents[section], [section])
    const currentApp = useMemo(() => list.find(l => l.id == id), [id, list])
    const loaded = useRef(false)
    const toast = useToast()
    const router = useRouter()
    const dialog = useDialog()

    const appNav = useMemo(() => [
        {
            icon: `colorfilter`,
            label: `Dashboard`,
            href: `/app/${id}/dashboard`
        },
        {
            icon: `book`,
            label: `Logs`,
            href: `/app/${id}/logs`
        },
        {
            icon: `hashtag`,
            label: `Source Code`,
            href: `/app/${id}/source`
        },
        {
            icon: `setting-4`,
            label: `Setting`,
            href: `/app/${id}/setting`
        },
    ], [id])

    const loadApps = useCallback(async () => {
        dispatch({
            loading: true,
            dashboard: {
                loading: false,
                stats: null
            }
        })
        withPost<{
            kind: string;
            apps: ZuzApp[];
            users?: LinuxUser[];
        }>(`/_/apps/list`, { id })
            .then(resp => {
                loaded.current = true
                if ( resp.apps.length == 0 ){
                    toast.error(`App not found or you don't have permission to access it.`)
                    router.push(`/apps?_404=1`)
                }
                else {
                    dispatch({
                        loading: false,
                        list: resp.apps,
                        users: resp.users || users
                    })
                }
            })
            .catch(error => {
                loaded.current = true
                dispatch({ loading: false, error: error.reason || error.message || `Failed to load apps` })
            })
    }, [])

    const loadUsers = useCallback(async () => {
        withPost<{
            users: LinuxUser[]
        }>(
            `/_/users/ls`,
            {}
        )
        .then(resp => dispatch({ users: resp.users }))
        .catch(resp => dispatch({ users: [] }))
    }, [])

    const switchAppMode = async (appId: string, mode: AppSwitchMode) : Promise<dynamic> => withPost(`/_/apps/switch`, {
        appId,
        mode
    })

    const act = (action: AppSwitchMode) => {
        const dh = dialog.show({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} App`,
            message: `Are you sure you want to ${action} this app?`,
            action: [
                {
                    label: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                    onClick: () => {
                        dh.setLoading(true)
                        switchAppMode(id, action)
                        .then(() => {
                            toast.success(`App ${action}ed successfully!`)
                            dh.hide()
                            dispatch({ 
                                list: list.map(l => l.id == id ? 
                                    { ...l, status: action == `start` || action == `restart` ? ZuzAppStatus.Running : ZuzAppStatus.Stopped } : l) })
                        })
                        .catch(err => {
                            dh.setLoading(false)
                            toast.error(`Failed to ${action} app: ${err.message}`)
                        })
                    }
                }
            ]
        })
    }
    
    useEffect(() => {
        if (
            !loaded.current && 
            !list.find(a => a.id == id) ) {
            loadApps()
            loadUsers()
        }
    }, [id, list])

    return <Box
        as={`maxW:270 flex:1 h:full p:25 flex cols gap:8`}>

            <Box as={`logo flex cols gap:4 p:10`}>
                <Text as={`s:20 bold`}>App</Text>
                {currentApp && <Text as={`text-wrap s:14`}>{currentApp?.name ?? `...`}</Text>}
            </Box> 

            <Box as={`flex aic gap:5 mb:20 pl:10`}>
                {   !loading && currentApp && 
                    (
                        currentApp?.status == ZuzAppStatus.Stopped ||
                        currentApp?.status == ZuzAppStatus.Unknown
                    )
                    ? (
                    <Button as={`bold`} variant={Variant.XSmall} onClick={() => act(`start`)}  icon={`play`}>Start</Button>
                ) : (
                    <>
                        <Button as={`bold`} variant={Variant.XSmall} onClick={() => act(`stop`)} icon={`stop`}>Stop</Button>
                        <Button as={`bold`} variant={Variant.XSmall} onClick={() => act(`restart`)} icon={`refresh`}>Restart</Button>
                    </>
                )}
            </Box>

            {loading ? <Spinner />
                : appNav.map((n, i) => <Link 
                    key={`app-nav-${i}-${n.label}`}
                    href={n.href} 
                    className={css([
                        `flex aic ass r:20 gap:10 tdn p:6,10 opacity:0.5 &hover(bg:$dim-light opacity:1)`,
                        `${pathName == n.href ? `bg:$dim-hover opacity:0.9` : ``}`
                    ])}>
                    <Icon name={n.icon} as={`s:20`} />
                    <Text as={`s:18`}>{n.label}</Text>
            </Link>)}

    </Box>
}

export default Sidebar;