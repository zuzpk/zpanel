"use client"
import { Box, css, Text, Icon, Group, TRANSITIONS, TRANSITION_CURVES, Image, Spinner, useToast } from '@zuzjs/ui';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { APP_NAME, APP_VERSION } from "@/config"
import { sectionComponents } from './layout';
import { AppStore, Store } from '@/store';
import { useStore } from '@zuzjs/store';
import { withPost } from '@zuzjs/core';
import { LinuxUser, ZuzApp } from '@/types';
import { useDelayed } from '@zuzjs/hooks';

const Sidebar : React.FC = (_props) => {

    const { app } = useParams()
    const [ id, section ] = app
    const pathName = usePathname()
    const when = useDelayed()
    const { loading, error, users, list, dispatch  } = useStore<typeof AppStore.Apps>(Store.Apps)
    const currentSection = useMemo(() => sectionComponents[section], [section])
    const currentApp = useMemo(() => list.find(l => l.id == id), [id, list])
    const loaded = useRef(false)
    const toast = useToast()
    const router = useRouter()

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
            loading: true
        })
        withPost<{
            kind: string;
            apps: ZuzApp[];
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
                        list: resp.apps
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

            <Box as={`logo flex cols gap:4 p:10 mb:20`}>
                <Text as={`s:20 bold`}>App</Text>
                {currentApp && <Text as={`text-wrap s:14`}>{currentApp?.name ?? `...`}</Text>}
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