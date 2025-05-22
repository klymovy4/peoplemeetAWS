export interface IUser {
   name: string
   isOnline: boolean
   is_online?: boolean
   description: string
   sex: string
   age: number
   image: string
   lat: number | null
   lng: number | null
   id?: number
}

export interface IAccountUser {
   name: string
   description: string
   sex: string
   age: number
   image: string
}