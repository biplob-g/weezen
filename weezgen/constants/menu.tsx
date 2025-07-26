import { LayoutDashboard, MailIcon, MessageSquare, MessageSquareMore, Settings, Settings2, SquareUser, StarIcon, TimerIcon, UserRoundPen } from "lucide-react"

type SIDE_BAR_MAIN_PROPS ={
    label: string
    icon: JSX.Element
    path: string
}

export const SIDE_BAR_MENU : SIDE_BAR_MAIN_PROPS[] = [
    {
        label: 'Dashboard',
        icon: <LayoutDashboard/>,
        path: 'dashboard',
    },
    {
        label: 'Conversation',
        icon: <MessageSquareMore/>,
        path: 'conversation',
    },

  { 
     label: 'Intergation',
    icon: <Settings2/>,
    path: 'integration',
},
{
    label: 'Settings',
    icon: <Settings/>,
    path: 'settings',
},
{
    label: 'Appointment',
    icon: <SquareUser/>,
    path: 'appointment',
},
{
    label: 'Email Marketing',
    icon: <MailIcon />,
    path: 'email-marketing',
},
]

type TABS_MENU_PROPS ={
    label : string
    icon? : JSX.Element
}

export const TABS_MENU: TABS_MENU_PROPS[] = [
    {
        label: 'unread',
        icon: <MailIcon/>,
    },
    {
label: 'all',
icon: <MailIcon/>
    },
    {
        label: 'expired',
        icon: <TimerIcon/>
    },
    {
        label: 'starred',
        icon: <StarIcon/>
    }
]


export const HELP_DESK_TAB_MENU: TABS_MENU_PROPS[] = [
    {
        label: 'help desk',
    },
    {
        label: 'questions',
    },
]

export const APPOINTMENT_TABLE_HEADER = [
'Name',
'RequestedTime',
'Added Time',
'Domain',
]

export const EMAIL_MARKETING_HEADER = ['Id', 'Email', 'Answers', 'Domain']

export const BOT_TABS_MENU: TABS_MENU_PROPS[] =[
    {
        label: 'chat',
        icon: <MessageSquare/>,
    },
    {
        label: 'helpdesk',
        icon: <UserRoundPen/>,
    }
]