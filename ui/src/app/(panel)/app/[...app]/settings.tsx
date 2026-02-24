"use client"
import { AppStore, Store } from "@/store";
import { useStore } from "@zuzjs/store";
import { Box, Button, Form, Input, SPINNER, Spinner, Switch, Text, Textarea, useToast } from '@zuzjs/ui';
import { useParams } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DirChooser from '../../filemanager/dir-chooser';
import PageTitle from '../../page-title';

const Settings : React.FC = (_props) => {

    const { loading, error, users, list  } = useStore<typeof AppStore.Apps>(Store.Apps)
    const { app } = useParams()
    const [ appId, section ] = app as Array<string>
    const toast = useToast()
    const [ privateRepo, setPrivateRepo ] = useState(false)
    const homeDir = useRef<HTMLInputElement>(null)
    const currentApp = useMemo(() => list.find(l => l.id == appId), [appId, loading, list])
    // const userSelect = useRef<SelectHandler>(null)

    useEffect(() => {
        document.title = `Settings`
        if ( 
            users.length > 0 && 
            currentApp
            // users.find(u => currentApp.user == u.username)
        ){
            // userSelect.current?.setSelected({ label: currentApp.user, value: currentApp.user })
            setPrivateRepo(currentApp.git?.isPrivate ?? false)
        }
    }, [users, currentApp])

    return <Box as={`flex cols h:100vh w:calc[100vw - 330px] p:$page-padding overflow-y`}>
        <PageTitle 
            crumb={[
                { label: `Settings`, link: `/app/${appId}/settings`, icon: `setting-4` }
            ]}
            />
        <Box as={`flex flex:1 rel`}>
            { loading ? 
                <Spinner type={SPINNER.Wave} as={`abs abc`} /> 
                :  <Form
                    errors={{
                        name: `Enter your app name`,
                        domain: `Enter your app domain`,
                    }}
                    onSuccess={resp => toast.success(resp.message || `App settings updated successfully`)}
                    onError={err => toast.error(err.message || `App was not created...`)}
                    action={`/_/apps/update_app_settings`}
                    withData={{ appId }}
                    as={`flex cols gap:5 flex:1 w:600 maxW:600 p:0,20,20,20 bg:$dim-light overflowY:auto`}>
                    
                    <Text as={`s:14 bold mt:20`}>Name</Text>
                    <Text as={`s:12 mb:5 opacity:0.5`}>Display name for your app</Text>
                    <Input 
                        defaultValue={currentApp?.name || ``}
                        placeholder={`App Name`} name={`name`}  required />

                    <Text as={`s:14 bold mt:20`}>Domain</Text>
                    <Text as={`s:12 mb:5 opacity:0.5`}>Public domain name for your app</Text>
                    <Input 
                        defaultValue={currentApp?.domain || ``}
                        placeholder={`www.example.com`} name={`domain`}  required />

                    {/* <Text as={`s:14 bold mt:20`}>System User</Text>
                    <Text as={`s:12 mb:5 opacity:0.5`}>Choose a system user to assign to this app</Text>
                    <Select
                        ref={userSelect}
                        name={`usr`}
                        as={`w:200!`}
                        search={true}
                        searchPlaceholder={`Search user...`}
                        selected={users.find(u => u.username == currentApp?.user) ? 
                            { 
                                label: users.find(u => u.username == currentApp?.user)!.username, 
                                value: users.find(u => u.username == currentApp?.user)!.username, 
                                icon: `frame` }
                            : { label: `root`, value: `root`, icon: `frame` }
                        }
                        
                        options={users.map(u => ({
                            label: u.username,
                            value: u.username,
                            icon: `frame`
                        }))} /> */}
                        
                    <Text as={`s:14 bold mt:30`}>Repository URL (Optional)</Text>
                    <Text as={`s:12 mb:5 opacity:0.5`}>Paste your github repo url</Text>
                    <Input 
                        defaultValue={currentApp?.git?.url ?? ``}
                        placeholder={`https://github.com/zuzpk/frontend-ts.git`} name={`repo`}  />

                    <Box as={`flex aic gap:50 mt:20`}>
                        <Box as={`flex cols flex:1`}>
                            <Text as={`s:14 bold`}>Private Repository?</Text>
                            <Text as={`s:12 mb:5 opacity:0.5`}>If repo is private or shared only</Text>
                        </Box>
                        <Box as={`flex flex:1`}>
                            <Switch 
                                onSwitch={p => setPrivateRepo(p)}
                                checked={currentApp?.git?.isPrivate ?? false}
                                name={`isprivate`} />
                        </Box>
                    </Box>

                    {privateRepo && <>
                        <Text as={`s:14 bold m:20,0,5,0`}>Access Key (PEM format)</Text>
                        <Textarea 
                            defaultValue={currentApp?.git?.pem ?? ``}
                            placeholder={`Paste key here`} name={`pem`}  as={`h:100`} />

                        <Text as={`s:14 bold mt:20`}>Github App ID</Text>
                        <Text as={`s:12 opacity:0.5`}>Find your app id at https://www.github.com/settings/apps</Text>
                        <Text as={`s:12 opacity:0.5`}>Select your app from the list</Text>
                        <Text as={`s:12 mb:5 opacity:0.5`}>Under About you will find the App ID</Text>
                        <Input 
                            defaultValue={currentApp?.git?.appId || ``}
                            placeholder={`App Id`} name={`gitAppId`}  />

                        <Text as={`s:14 bold mt:20`}>Installation Id</Text>
                        <Text as={`s:12 opacity:0.5`}>Goto https://www.github.com/settings/installations</Text>
                        <Text as={`s:12 opacity:0.5`}>Select your app from the list</Text>
                        <Text as={`s:12 mb:5 opacity:0.5`}>Find your installationId from url https://www.github.com/settings/installations/[INSTALLATION_ID]</Text>
                        <Input 
                            defaultValue={currentApp?.git?.installationId || ``}
                            placeholder={`Installation Id`} name={`installationId`}  />

                    </>}

                    <Text as={`s:14 bold mt:20`}>Worker Name (Optional)</Text>
                    <Text as={`s:12 mb:5 opacity:0.5`}>Will be auto generated based on your app name if not provided</Text>
                    <Input 
                        defaultValue={currentApp?.worker || ``}
                        placeholder={`Service Name`} name={`worker`}  />
                    
                    <Text as={`s:14 bold mt:20`}>Description (Optional)</Text>
                    <Text as={`s:12 mb:5 opacity:0.5`}>A line about what your app is all about</Text>
                    <Input 
                        defaultValue={currentApp?.description || ``}
                        placeholder={`App Description`} name={`desc`}  />

                    <Text as={`s:14 bold mt:20`}>Home Directory</Text>
                    <Text as={`s:12 mb:5 opacity:0.5`}>Root directory of your app</Text>
                    <DirChooser 
                        defaultPath={currentApp?.path || `/home`}
                        onChoose={d => {
                            if ( homeDir.current ){
                                homeDir.current.value = d
                            }
                        }} />

                    <Input 
                        defaultValue={currentApp?.path || ``}
                        type={`hidden`} ref={homeDir} name={`root`} />    

                    <Button 
                        type={`submit`} 
                         
                        as={`mt:70 w:160! bold`}>Save Changes</Button>

                    </Form>}
        </Box>
    </Box>
}

export default Settings;