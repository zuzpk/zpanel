"use client"
import { VirtualHost } from '@/types';
import { Box, Button, Form, FormHandler, Group, Input, Label, Select, Switch, Text, useToast, Variant } from '@zuzjs/ui';
import React, { useRef, useState } from 'react';
import DirChooser from '../filemanager/dir-chooser';
import { useDelayed } from '@zuzjs/hooks';

const VirtualhostEditor : React.FC<{
    source?: VirtualHost,
    onSave?: () => void
}> = ({ 
    onSave,
    source = {
        id: `-`,
        domain: ``,
        listenPort: 80,
        proxyHost: `127.0.0.1`,
        proxyPort: 3000,
        type: `proxy`,
        websockets: false,
        rootPath: `/home`,
        accessLog: `/var/log/nginx`,
        errorLog: `/var/log/nginx`
    } satisfies VirtualHost
}) => {

    const { 
        id, 
        domain, 
        listenPort, 
        proxyHost,
        proxyPort,
        type,
        websockets,
        rootPath,
        accessLog,
        errorLog,
    } = source

    const [ _type, setType ] = useState(type == `static` ? { label: `Static`, value: `static` } : { label: `Proxy`, value: `proxy` })
    const [ _websockets, setWebsockets ] = useState(websockets)
    const _rootPath = useRef<HTMLInputElement>(null)
    const _accessLogPath = useRef<HTMLInputElement>(null)
    const _errorLogPath = useRef<HTMLInputElement>(null)
    const form = useRef<FormHandler>(null)
    const toast = useToast()
    const when = useDelayed()

    return <Form 
        ref={form}
        onSuccess={(r) => {
            toast.success(r.message)
            onSave?.()
        }}
        onError={(e) => {
            toast.error(e.message)
        }}
        action={`/_/nginx/save_virtual_host`}
        as={`flex cols gap:5 w:50vw h:100vh p:50 bg:$dim-light overflowY:auto`}>
        
        {/* <Group
            fx={{
                ...Animations.Form,
                when
            }}
            fxStep={0.1}> */}

        <Text as={`s:24 bold`}>VirtualHost</Text>
        <Text as={`s:16 opacity:0.6`}>Add new Nginx VirtualHost</Text>
        
        <Box as={`flex cols gap:30 mt:30`}>
            <Box as={`flex cols gap:6 maxW:200`}>
                <Text as={`s:16 bold`}>Type</Text>
                <Select 
                    onChange={v => setType(v)}
                    name={`type`}
                    variant={Variant.Medium}
                    selected={_type}
                    options={[
                        { label: `Static`, value: `static` },
                        { label: `Proxy`, value: `proxy` },
                    ]} />
            </Box>

            <Box as={`flex cols gap:6`}>
                <Label as={`flex aic gap:20`}>
                    <Switch 
                        onSwitch={v => setWebsockets(v)}
                        variant={Variant.Medium} 
                        checked={websockets}  />
                    <Text as={`s:16 bold`}>With WebSockets</Text>
                </Label>
            </Box>

            <Box as={`flex aic gap:15`}>        
                <Box as={`flex cols gap:6 flex:1`}>
                        <Text as={`s:16 bold`}>Domain</Text>
                        <Input defaultValue={domain} name={`domain`} placeholder={`www.example.com`} />
                </Box>
                <Box as={`flex cols gap:6 maxW:100`}>
                    <Text as={`s:16 bold`}>Port</Text>
                    <Input defaultValue={listenPort} name={`port`} placeholder={`80`} />
                </Box>
            </Box>

            { _type.value == `proxy` && <Box as={`flex aic gap:15`}>        
                <Box as={`flex cols gap:6 flex:1`}>
                    <Text as={`s:16 bold`}>Proxy Host</Text>
                    <Input defaultValue={proxyHost} name={`proxyHost`} placeholder={`www.example.com`} />
                </Box>
                <Box as={`flex cols gap:6 maxW:100`}>
                    <Text as={`s:16 bold`}>Port</Text>
                    <Input defaultValue={proxyPort} name={`proxyPort`} placeholder={`3000`} />
                </Box>
            </Box> }

            <Box as={`flex cols gap:6`}>
                <Text as={`s:16 bold`}>Root Path</Text>
                <DirChooser
                    defaultPath={rootPath!} 
                    onChoose={d => {
                        if ( _rootPath.current ){
                            _rootPath.current.value = d
                        }
                    }} />
            </Box>

            <Box as={`flex cols gap:6`}>
                <Text as={`s:16 bold`}>Access Log Path</Text>
                <DirChooser
                    defaultPath={accessLog!} 
                    onChoose={d => {
                        if ( _accessLogPath.current ){
                            _accessLogPath.current.value = d
                        }
                    }} />
            </Box>

            <Box as={`flex cols gap:6`}>
                <Text as={`s:16 bold`}>Error Log Path</Text>
                <DirChooser
                    defaultPath={errorLog!} 
                    onChoose={d => {
                        if ( _errorLogPath.current ){
                            _errorLogPath.current.value = d
                        }
                    }} />
            </Box>

            

            
            <Input type={`hidden`} value={id} name={`id`} />
            <Input type={`hidden`} value={_websockets == true ? 1 : 0} name={`websockets`} />
            <Input type={`hidden`} ref={_rootPath} value={rootPath} name={`rootPath`} />
            <Input type={`hidden`} ref={_accessLogPath} value={accessLog} name={`accessLog`} />
            <Input type={`hidden`} ref={_errorLogPath} value={errorLog} name={`errorLog`} />

            <Button type={`submit`} as={`mt:30`}>Save Host</Button>
        </Box>

        {/* </Group> */}

    </Form>
}

export default VirtualhostEditor;