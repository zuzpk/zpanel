"use client"
import { FB_PIXEL_ID, GA_MEASUREMENT_ID } from "@/config";
import { AppStore, Store } from "@/store";
import createStore from "@zuzjs/store";
import { Box, ToastProvider, useFacebookPixel, useGoogleTagManager } from "@zuzjs/ui";
import "@zuzjs/ui/styles";
import { ReactNode, useEffect } from "react";
import PushNotifications from "@/app/webpush";

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

    return <ToastProvider>
        <Provider>
            <UserProvider>
                <Box as={`app flex minH:100vh`}>
                <PushNotifications />
                {children}
                </Box>
            </UserProvider>
        </Provider>
    </ToastProvider>

}

export default Wrapper