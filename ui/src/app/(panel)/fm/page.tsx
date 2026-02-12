"use client"
import { Box, Button, Crumb, Text, Variant } from "@zuzjs/ui";
import FileManager from "../filemanager";
import PageTitle from "../page-title";
import { useStore } from "@zuzjs/store";
import { AppStore, Store } from "@/store";
import { pubsub } from "@/cache";
import { PubEvent } from "@/types";
import FileManagerContext from "./context";

const Page: React.FC = () => {

    const { 
        loading, 
        currentDir,
        selectedItem
    } = useStore<typeof AppStore.FileManager>(Store.FileManager);

    return (
        <Box as={`w:calc[100vw - 60px] h:100dvh no-overflow flex cols p:$page-padding`}>
            <Box as={`flex aic rel`}>
                <Box as={`flex flex:1 cols`}>
                    <Text as={`s:18 bold mb:6 pl:6`}>Files</Text>
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
                <Box as={`flex aic gap:5`}>
                    <Button 
                        as={`--btn`} 
                        icon={`folder-add`} 
                        variant={Variant.Small}>New Folder</Button>
                    <Button 
                        as={`--btn`} 
                        icon={`document-upload`} 
                        variant={Variant.Small}>Upload</Button>
                </Box>
            </Box>
            <FileManagerContext 
                menu={selectedItem ? [
                    {
                        enabled: true,
                        label: `New Folder`,
                        icon: `folder-add`,
                        action: () => {}
                    },
                    {
                        enabled: true,
                        label: `Upload File`,
                        icon: `document-upload`,
                        action: () => {}
                    },
                    {
                        enabled: true,
                        label: `Open`,
                        icon: `folder-open`,
                        action: () => {}
                    },
                    {
                        enabled: true,
                        label: `Rename File`,
                        icon: `edit`,
                        action: () => {}
                    },
                    {
                        enabled: true,
                        label: `Edit File`,
                        icon: `code`,
                        action: () => {}
                    },
                    {
                        enabled: true,
                        label: `Download File`,
                        icon: `document-download`,
                        action: () => {}
                    },
                    {
                        enabled: true,
                        label: `Delete File`,
                        icon: `trash`,
                        action: () => {}
                    }
                ] : []} />
            <FileManager />
        </Box>
    );
}

export default Page;
