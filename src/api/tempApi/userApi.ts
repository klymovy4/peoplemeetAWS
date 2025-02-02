export const loginUser = async (data: { email: string; password: string }) => {
   try {
      // const mode = import.meta.env.MODE;
      // const baseApi = import.meta.env.VITE_API_URL;
      //
      // const url = mode === 'development' ? `${baseApi}/login` : '/login';

      const response = await fetch('/login', {  // Добавил baseUrl
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log(responseData);

      if (!response.ok) {
         return {status: 'failed', data: responseData};
      }

      return {status: 'success', data: responseData};
   } catch (error) {
      console.error('Error:', error);
      return {status: 'failed', error: error};
   }
};

export const signUpUser = async (data: { email: string; password: string }) => {
   try {
      const response = await fetch('/signup', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(data)
      })

      const responseData = await response.json();
      console.log(responseData);

      if (!response.ok) {
         return {status: 'failed', data: responseData};
      }

      return {status: 'success', data: responseData};
   } catch (error) {
      console.error('Error:', error);
      return {status: 'failed', error: error};
   }
}

export const getSelf = async (token: string) => {
   const data = {
      token
   };

   try {
      const response = await fetch('/self', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(data)
      })

      const responseData = await response.json();
      console.log(responseData);

      if (!response.ok) {
         return {status: 'failed', data: responseData};
      }

      return {status: 'success', data: responseData};
   } catch (error) {
      console.error('Error:', error);
      return {status: 'failed', error: error};
   }
}

export const uploadAvatar = async (file: File, token: string) => {
   const formData = new FormData();
   formData.append("photo", file);
   formData.append("token", token);

   try {
      const response = await fetch('/upload', {
         method: 'POST',
         body: formData
      })

      const responseData = await response.json();

      if (!response.ok) {
         return {status: 'failed', data: responseData};
      }

      return {status: 'success', data: responseData};
   } catch (error) {
      console.error('Error:', error);
      return {status: 'failed', error: error};
   }
}

export const editProfile = async (data:  any) => {
   try {
      const response = await fetch('/profile', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
         return {status: 'failed', data: responseData};
      }

      return {status: 'success', data: responseData};
   } catch (error) {
      console.error('Error:', error);
      return {status: 'failed', error: error};
   }
}

export const getOnline = async (data: any) => {
   try {
      const response = await fetch('/online', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
         return {status: 'failed', data: responseData};
      }

      return {status: 'success', data: responseData};
   } catch (error) {
      console.error('Error:', error);
      return {status: 'failed', error: error};
   }
}