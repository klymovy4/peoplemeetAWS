export interface IUser {
   name: string
   isOnline: boolean
   description: string
   sex: string
   age: number
   image: string
   location: {
      lat: number | null
      lng: number | null
   }
   id?: number
}