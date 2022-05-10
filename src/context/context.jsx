import React, { useState, useEffect, useContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext=React.createContext()

//provider ,consumer -githubcontext.provider

const GithubProvider=({children})=>{
    const [gitHubUser,setGithubUser]=useState(mockUser)
    const [repos,setRepos]=useState(mockRepos)
    const [followers,setFollowers]=useState(mockFollowers)
    //request loading

    const [requests,setRequests]=useState(0)
    const [loading,setIsLoading]=useState(false)
    const [error,setError]=useState({show:false,msg:''})
    const searchGithubUser=async(user)=>{
        toggleError()
        setIsLoading(true)

        const response =await axios(`${rootUrl}/users/${user}`)
                        .catch(err=>console.log(err))
        
        if(response){
            setGithubUser(response.data)
            const {login,followers_url}=response.data
            
            //more logic here
            //repos
            // [Repos](https://api.github.com/users/john-smilga/repos?per_page=100)
            //followers
            // - [Followers](https://api.github.com/users/john-smilga/followers)
            
            await Promise.allSettled([
                axios(`${rootUrl}/users/${login}/repos?per_page=100`),
                axios(`${followers_url}?per_page=100`)
            ]).then((results)=>{
                const [repos,followers]=results
                const status='fulfilled'
                if(repos.status===status){
                    setRepos(repos.value.data)
                }
                if(followers.status===status){
                    setFollowers(followers.value.data)
                }
            }).catch(err=>console.log(err))
        }
        else{
            toggleError(true,'there is no user with username')
        }
        checkRequest()
        setIsLoading(false)
    }
    
    
    const checkRequest=()=>{
        axios(`${ rootUrl}/rate_limit`).then(({data})=>{
            let {rate:{remaining}}=data
            
            setRequests(remaining)

            if(remaining===0){
                //throww an error
                toggleError(true,' Sory you have Exceeded your hourly rate limit!')
            }
        }).catch((error)=>console.log(error))
    }
    //error
   const toggleError=(show=false,msg='')=>{
        setError({show,msg})
    }

    useEffect(checkRequest,[])

    return <GithubContext.Provider value={{gitHubUser,loading,searchGithubUser,error,repos,followers,requests}}>
        {children}
    </GithubContext.Provider>
}

export const useGlobalContext=()=>{
    return useContext(GithubContext)
}

export {GithubContext,GithubProvider}