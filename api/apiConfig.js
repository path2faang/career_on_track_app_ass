import axios from 'axios';

export const axiosPrivate = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASEURL,
    withCredentials: true,
});


export const axiosPublic = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASEURL,
    withCredentials: false
});
