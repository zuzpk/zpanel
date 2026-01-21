"use client"
import { useStore } from '@zuzjs/store';
import { Box, Crumb, ScrollView, Text } from '@zuzjs/ui';
import React from 'react';
import { AppStore, Store } from '../../../store';
import { pubsub } from '../../../cache';
import { PubEvent } from '../../../types';
import FileManager from '.';

const FileBrowser : React.FC<{
    onChoose: (dir: string) => void
}> = ({ onChoose }) => {
    
    const { 
        loading, 
        currentDir } = useStore<typeof AppStore.FileManager>(Store.FileManager);


    return <ScrollView as={`flex:1 flex cols minW:800`}>

        <Box as={`p:25,0,10,20 flex cols borderBottom:1,$border,solid`}>
            <Text as={`s:18 bold mb:6 pl:6`}>Choose Home Directory</Text>
            <Text as={`s:14 opacity:0.5 p:0,6`}>Path: {currentDir}</Text>
            { currentDir !== `/` && <Crumb
                items={[
                    {
                        label: `Root`,
                        action: () => pubsub.emit(PubEvent.OpenDirectory, `/`)
                    },
                    ...currentDir.split(`/`)
                    .filter(n => Boolean(n))
                    .map((c, i) => ({
                        label: c,
                        action: () => {
                            pubsub.emit(PubEvent.OpenDirectory,  [ ...currentDir.split(`/`).slice(0, i+1), c ].join(`/`))
                        }
                        }))]} /> }
            <Box as={`h:15`} />
        </Box>
        <FileManager 
            onSelect={onChoose}
            onDirChange={onChoose} />

    </ScrollView>
}

export default FileBrowser;