"use client"
import { Box, Button, Cover, Drawer, DRAWER_SIDE, DrawerHandler, Spinner, SPINNER, Table, Text, useToast, Variant } from '@zuzjs/ui';
import React, { useCallback, useEffect, useRef } from 'react';
import Modules from './modules';
import ModuleItem from './module_item';
import { useStore } from "@zuzjs/store"
import { AppStore, Store } from '@/store';
import { withPost } from '@zuzjs/core';
import { NginxServerBlock, PubEvent } from '@/types';
import Dot from '@/app/dot';
import CodeEditor from '../vscode';
import { basename } from "path"
import NewFile from '../filemanager/new-file';
import { pubsub } from '@/cache';

const Page : React.FC = (_props) => {
    
    const you = useStore<typeof AppStore.User>(Store.User)
    const { 
        loading,
        isRunning,
        version,
        working,
        blocks,
        dispatch,
    } = useStore<typeof AppStore.Nginx>(Store.Nginx)
    const editor = useRef<DrawerHandler>(null)
    const createFile = useRef<DrawerHandler>(null)
    const toast = useToast()

    const loadData = useCallback(async () => {
        dispatch({ loading: true,  error: null })
        withPost<{
            isRunning: boolean,
            version: string,
            blocks: NginxServerBlock,
        }>(
            `/_/nginx/ls`,
            {}
        )
        .then(resp => {
            dispatch({ loading: false,  error: null, blocks: resp.blocks, isRunning: resp.isRunning, version: resp.version })
        })
        .catch(err => {
            dispatch({ loading: false,  error: err.message || `Nginx Block not loaded` })
        })
    }, [])

    const editBlock = useCallback(async (r: NginxServerBlock) => {
        dispatch({ working: true,  error: null })
        withPost<{
            content: string
        }>(
            `/_/nginx/load_file`,
            { id: r.id }
        )
        .then(resp => {
            dispatch({ working: false,  error: null })
            editor.current?.open(<Box as={`flex cols w:90vw`}>
                <CodeEditor 
                    files={[
                        {
                            token: r.id,
                            path: r.path,
                            label: basename(r.path),
                            isDir: false,
                            size: 1024 *2,   
                            modified: Date.now(),
                            content: resp.content
                        }
                    ]} />
            </Box>)
        })
        .catch(err => {
            toast.error(err.message || `Conf file was not loaded...`)
            dispatch({ working: false,  error: null })
        })
        
    }, [])

    useEffect(() => {
        window.document.title = `Nginx`
    }, [you.loading])

    useEffect(() => {
        loadData()
        pubsub.on(PubEvent.OnNginxConfFileCreated, () => {
            createFile.current?.close()
            loadData()
        })
    }, [])

    return <><Box as={`w:calc[100vw - 60px] h:100dvh no-overflow flex cols p:$page-padding gap:15`}>
        <Cover when={working} />
        <Box as={`flex aic rel`}>
            <Box as={`flex flex:1 cols`}>
                <Box as={`flex aic rel`}>
                    <Dot type={isRunning ? `success` : `dead`} loading={loading} size={12} />
                    <Text as={`s:18 bold pl:6`}>Nginx</Text>
                </Box>
            </Box>
            <Box as={`flex aic gap:5`}>
                <Button 
                    onClick={() => createFile.current?.open(<NewFile event={PubEvent.OnNginxConfFileCreated} />)}
                    as={`--btn`} 
                    icon={`add`} 
                    variant={Variant.Small}>New Server</Button>
            </Box>
        </Box>
        <Table 
            animateRows={true}
            loading={loading}
            loadingRowCount={6}
            hoverable={false}
            schema={[
                {
                    id: `sid`,
                    value: <Text as={`s:14 bold opacity:0.5`}>Name</Text>,
                    render: r => <Box as={`flex cols gap:2`}>
                        <Box as={`flex aic gap:5`}>
                            <Dot type={r.isActive ? `success` : `dead`} size={10} />
                            <Text as={`s:16 bold`}>{r.domain}</Text>
                        </Box>
                        <Text as={`s:14 opacity:0.5`}>{r.path}</Text>
                    </Box>,
                },
                {
                    id: `action`,
                    maxW: 120,
                    value: <Text as={`s:14 bold opacity:0.5`}>Action</Text>,
                    render: r => <Box as={`flex aic gap:10`}>
                        <Button 
                            onClick={() => editBlock(r)}
                            as={`s:16 bg:transparent! c:$primary! &hover(tdu)`}>Edit</Button>
                    </Box>,
                }
            ]}
            rows={blocks}
            />
   </Box>
   <Drawer 
    from={DRAWER_SIDE.Right}
    ref={editor}
    />
   <Drawer 
    from={DRAWER_SIDE.Right}
    ref={createFile}
    />
   </>
}

export default Page;