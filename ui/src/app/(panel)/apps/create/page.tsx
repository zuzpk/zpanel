"use client"
import { Box, Button, Crumb, Drawer, DRAWER_SIDE, DrawerHandler, Form, Input, Select, Switch, Text, Textarea, useToast, Variant } from '@zuzjs/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PageTitle from '../../page-title';
import FileManager from '../../filemanager';
import { useStore } from '@zuzjs/store';
import { AppStore, Store } from '../../../../store';
import { LinuxUser, PubEvent } from '../../../../types';
import { pubsub } from '../../../../cache';
import path from "path"
import FileBrowser from '../../filemanager/file-browser';
import { useRouter } from 'next/navigation';
import { withPost } from '@zuzjs/core';

const Page : React.FC = (_props) => {

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

    return <><Box as={`flex cols`}>
        <PageTitle 
            crumb={[
                {
                    label: `Apps`,
                    icon: `box`,
                    link: `/apps`,
                },
                {
                    label: `Create App`,
                    icon: `box`
                },
            ]}
            actions={[
                {
                    label: `Create App`,
                    fn: () => {
                        // router.push(`/apps/create`)
                    }
                }
            ]} />

        <Box as={`flex gap:50`}>
       
            <Form
                errors={{
                    name: `Enter your app name`,
                    root: `Choose Root Directory for your app`
                }}
                onSuccess={resp => router.push(`/app/${resp.id}/dashboard`)}
                onError={err => toast.error(err.message || `App was not created...`)}
                action={`/_/apps/create`}
                as={`flex:1 flex cols maxW:700 p:20,50`}>
                
                <Text as={`s:18 bold mb:20`}>App Detail</Text>

                <Text as={`s:14 bold`}>Repository URL (Optional)</Text>
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

                <Text as={`s:14 bold mt:20`}>Name</Text>
                <Text as={`s:12 mb:5 opacity:0.5`}>Display name for your app</Text>
                <Input placeholder={`App Name`} name={`name`} variant={Variant.Small} required />

                <Text as={`s:14 bold mt:20`}>Service Name (Optional)</Text>
                <Text as={`s:12 mb:5 opacity:0.5`}>Will be auto generated based on your app name if not provided</Text>
                <Input placeholder={`Service Name`} name={`service`} variant={Variant.Small} />
                
                <Text as={`s:14 bold mt:20`}>Description (Optional)</Text>
                <Text as={`s:12 mb:5 opacity:0.5`}>A line about what your app is all about</Text>
                <Input placeholder={`App Description`} name={`desc`} variant={Variant.Small} />

                <Text as={`s:14 bold mt:20`}>Home Directory</Text>
                <Text as={`s:12 mb:5 opacity:0.5`}>Root directory of your app</Text>
                <Box as={`flex aic gap:15`}>
                    <Input 
                        ref={homeDir}
                        placeholder={`/home/your-app`} name={`root`} variant={Variant.Small} required />
                    <Button 
                        onClick={chooseDir}
                        icon={`folder`} 
                        variant={Variant.Small} />
                </Box>

                <Button 
                    type={`submit`} 
                    variant={Variant.Small} 
                    as={`mt:40 w:160! bold`}>Continue</Button>

            </Form>

         </Box>

    </Box>
    <Drawer 
        ref={browser}
        prerender={true}
        from={DRAWER_SIDE.Right}
        margin={15}
        />
    </>
}

export default Page;