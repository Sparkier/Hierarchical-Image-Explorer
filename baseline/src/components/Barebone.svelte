
<script>
    const serverAdress = "http://localhost:25679/";

	import {onMount} from "svelte";
	import InfiniteScroll from "./InfiniteScroll.svelte";
    import axios from "axios";
	
    let allIds = []
    let page = 0;
	// if the api (like in this example) just have a simple numeric pagination
    let lastLoadedIndex = 0;
	// but most likely, you'll have to store a token to fetch the next page
	let nextUrl = '';
	// store all the data here.
	let data = [];
	// store the new batch of data here.
	let newBatch = [];
	
    // server sends IDs 
	async function fetchData() {
        const response = await fetch(serverAdress+"annotations/pages/" + page)
        newBatch = await response.json()
		    page++
        console.log(newBatch)
	};

    async function getAllIds(){
        console.log(serverAdress+"data/allIds")
        const response = await fetch(serverAdress + "data/allIds")
        allIds = await response.json();
        console.log(allIds)
    }   
	
	onMount(()=> {
		// load first batch onMount
        
        getAllIds();
		fetchData();
	})

  $: data = [
		...data,
    ...newBatch
  ];
</script>

<style>
  main {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  ul {
    box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    border-radius: 2px;
    width: 100%;
    max-width: 700px;
    max-height: 800px;
		background-color: white;
    overflow-x: scroll;
    list-style: none;
    padding: 0;
  }

  tr:hover {
    background-color: #eeeeee;
  }
</style>

<h1>Data Viewer</h1>
<!--  {#await fetchJson}
    <p>Loading JSON</p>
{:then result}
    <p>Mnist Test Dataset (10k Images)</p>
    
        <table class="table">
            <tr>
                <th>picture</th>
                <th>image ID</th>
                <th>lable</th>
            </tr>
            {#each result as entry, i}
            <tr>
                <td><MnistImg ID = {i} imgData={entry.image} /></td>
                <td>{i}</td>
                <td>{entry.label}</td>
            </tr>
            {/each}
        </table>
    
{/await}
-->
<main>
    <ul>
        <table class="table">
            <tr>
                <th>picture</th>
                <th>image ID</th>
                <th>lable</th>
            </tr>
            {#each data as item}
            <tr>
                <td><img src={serverAdress + "data/images/" + item.image_id}></td>
                <td>{item.image_id}</td>
                <td>{item.label}</td>
            </tr>
            {/each}
        </table>
      <InfiniteScroll
        hasMore={newBatch.length}
        threshold={100}
        on:loadMore={() => {fetchData()}} />
    </ul>
  </main>