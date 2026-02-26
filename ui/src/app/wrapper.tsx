"use client"
import PushNotifications from "@/app/webpush";
import { FB_PIXEL_ID, GA_MEASUREMENT_ID, LocalDB } from "@/config";
import { AppStore, Store } from "@/store";
import { DatabaseProvider, useFacebookPixel, useGoogleTagManager } from "@zuzjs/hooks";
import createStore from "@zuzjs/store";
import { Box, LayersProvider } from "@zuzjs/ui";
import { ReactNode, useEffect } from "react";

const Wrapper = ({ children } : Readonly<{ children: ReactNode; }>) => {

    return <Main>{children}</Main>

}

const Main = ({ children } : { children: ReactNode }) => {

    const { Provider } = createStore(Store.App, AppStore.App)
    const { Provider: UserProvider } = createStore(Store.User, AppStore.User)
    
    const { trackPageView: sendGTPageView } = useGoogleTagManager(GA_MEASUREMENT_ID!)
    const { trackPageView: sendFBPageView } = useFacebookPixel(FB_PIXEL_ID!)

    useEffect(() => {
        sendGTPageView()
        sendFBPageView()
    }, []);

    return <DatabaseProvider options={LocalDB.You}><Provider>
            <UserProvider>
                <LayersProvider>
                    <Box as={`app flex minH:100vh`}>
                    <PushNotifications />
                    {children}
                    </Box>
                </LayersProvider>
            </UserProvider>
        </Provider>
    </DatabaseProvider>

}

export default Wrapper