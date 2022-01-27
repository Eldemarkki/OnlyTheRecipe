import Head from 'next/head'
import { useEffect, useState } from 'react'
import Layout from '../../components/layout'
import { RecipeMetadata } from '../../lib/recipes'
import { GetOrCreateRecipeEntry } from '../api/recipes'

export default function Recipe() {
    const [data, setData] = useState({} as RecipeMetadata)
    const [isLoading, setLoading] = useState(false)

    const { ingredients, directions, title } = data

    const reqBody: GetOrCreateRecipeEntry = {
        url: "https://tasty.co/recipe/pizza-dough"
    }

    useEffect(() => {
        setLoading(true)
        fetch('../api/recipes', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reqBody)
        })
        .then((res) => res.json())
        .then((data) => {
            setData(data)
            setLoading(false)
        })
    }, [])

    if (isLoading) return <p>Loading...</p>
    if (!data) return <p>No profile data</p>

    return (
        <Layout>
            <Head>
                <title>{title}</title>
            </Head>
            <div>
                <h1>{title}</h1>
                <h1>Ingredients</h1>
                {ingredients?.map(i => <p>{i}</p>)}
                <h1>Directions</h1>
                {directions?.map(i => <p>{i}</p>)}
            </div>
        </Layout>
    )
}
