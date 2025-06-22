export interface IUser {
   id: number
   name: string
   isOnline: boolean
   is_online?: boolean
   description: string
   sex: string
   age: number
   image: string
   lat: number | null
   lng: number | null
   distance?: string
}

export interface IAccountUser {
   name: string
   description: string
   sex: string
   age: number
   image: string
}

export interface IChat {
   created_at: string
   id: number
   is_read: number
   message_text: string
   receiver_id: number
   sender_id: number
}