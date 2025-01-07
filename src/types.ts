export interface IUser {
   name: string
   isOnline: boolean
   description: string
   sex: string
   age: number
   avatar: string
   id: number
   location: {
      lat: number
      lng: number
   }
}