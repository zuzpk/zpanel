"use client"
import { Box, Button, Crumb, Drawer, DRAWER_SIDE, DrawerHandler, Form, Input, Select, Switch, Text, Textarea, useToast, Variant } from '@zuzjs/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PageTitle from '../page-title';
import { useStore } from '@zuzjs/store';
import { AppStore, Store } from '@/store';
import { LinuxUser, PubEvent } from '@/types';
import FileBrowser from '../filemanager/file-browser';
import { useRouter } from 'next/navigation';
import { withPost } from '@zuzjs/core';
import DirChooser from '../filemanager/dir-chooser';
import ZuzTerminal from '../terminal';

const AppEditor : React.FC = (_props) => {

    const homeDir = useRef<HTMLInputElement>(null)
    const [ privateRepo, setPrivateRepo ] = useState(false)
    const browser = useRef<DrawerHandler>(null)
    const router = useRouter()
    const toast = useToast()
    const { users, dispatch } = useStore<typeof AppStore.Apps>(Store.Apps)
    const chooseDir = useCallback(async () => {
        browser.current?.open(<FileBrowser 
                onChoose={d => {
                    if ( homeDir.current ){
                        homeDir.current.value = d
                    }
                    // browser.current?.close()
                }} />)
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
        document.title = `Create App`
        loadUsers()
    }, [])

    return <Box as={`flex gap:10 w:90vw`}>

        <Form
            errors={{
                name: `Enter your app name`,
                root: `Choose Root Directory for your app`
            }}
            onSuccess={resp => router.push(`/app/${resp.id}/dashboard`)}
            onError={err => toast.error(err.message || `App was not created...`)}
            action={`/_/apps/create`}
            as={`flex cols gap:5 flex:1 maxW:50vw h:100vh p:50 bg:$dim-light overflowY:auto`}>
                
            <Box as={`flex aic gap:50`}>
                <Box as={`flex cols flex:1`}>
                    <Text as={`s:24 bold`}>App</Text>
                    <Text as={`s:16 opacity:0.6`}>Add new app</Text>
                </Box>
                <Box as={`flex flex:1 jce`}>
                    <Button 
                        type={`submit`} 
                        variant={Variant.Small} 
                        as={`mt:10 w:160! bold`}>Publish</Button>
                </Box>
            </Box>

            <Text as={`s:14 bold mt:20`}>Name</Text>
            <Text as={`s:12 mb:5 opacity:0.5`}>Display name for your app</Text>
            <Input placeholder={`App Name`} name={`name`} variant={Variant.Small} required />

            <Text as={`s:14 bold mt:20`}>Home Directory</Text>
            <Text as={`s:12 mb:5 opacity:0.5`}>Root directory of your app</Text>
            <DirChooser 
                defaultPath={`/home`}
                onChoose={d => {
                    if ( homeDir.current ){
                        homeDir.current.value = d
                    }
                }} />

            <Text as={`s:14 bold mt:20`}>System User</Text>
            <Text as={`s:12 mb:5 opacity:0.5`}>Choose a system user to assign to this app</Text>
            <Select 
                name={`usr`}
                search={true}
                searchPlaceholder={`Search user...`}
                selected={{ label: `root`, value: `root`, icon: `frame` }}
                variant={Variant.Small}
                options={users.map(u => ({
                    label: u.username,
                    value: u.username,
                    icon: `frame`
                }))} />

            <Text as={`s:14 bold mt:30`}>Repository URL (Optional)</Text>
            <Text as={`s:12 mb:5 opacity:0.5`}>Paste your github repo url</Text>
            <Input placeholder={`https://github.com/zuzpk/frontend-ts.git`} name={`repo`} variant={Variant.Small} />

            <Box as={`flex aic gap:50 mt:20`}>
                <Box as={`flex cols flex:1`}>
                    <Text as={`s:14 bold`}>Private Repository?</Text>
                    <Text as={`s:12 mb:5 opacity:0.5`}>If repo is private or shared only</Text>
                </Box>
                <Box as={`flex flex:1`}>
                    <Switch 
                        onSwitch={p => setPrivateRepo(p)}
                        name={`isprivate`} />
                </Box>
            </Box>

            {privateRepo && <>
            <Text as={`s:14 bold m:20,0,5,0`}>Access Key (PEM format)</Text>
            <Textarea placeholder={`Paste key here`} name={`pem`} variant={Variant.Small} as={`h:100`} />
            </>}

            

            

            <Text as={`s:14 bold mt:20`}>Service Name (Optional)</Text>
            <Text as={`s:12 mb:5 opacity:0.5`}>Will be auto generated based on your app name if not provided</Text>
            <Input placeholder={`Service Name`} name={`service`} variant={Variant.Small} />
            
            <Text as={`s:14 bold mt:20`}>Description (Optional)</Text>
            <Text as={`s:12 mb:5 opacity:0.5`}>A line about what your app is all about</Text>
            <Input placeholder={`App Description`} name={`desc`} variant={Variant.Small} />

            <Input type={`hidden`} ref={homeDir} name={`root`} />            

        </Form>
        <Box as={`flex:1 maxW:50vw p:20,20,0,20 h:100vh bg:000 flex cols`}>
            <PageTitle
                crumb={[
                    {
                        label: `Terminal`,
                        icon: `code-1`
                    }
                ]}
             />
            <ZuzTerminal 
               appId={`new`} />
        </Box>
    </Box>
}

export default AppEditor;