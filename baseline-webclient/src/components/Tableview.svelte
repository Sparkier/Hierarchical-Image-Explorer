<script>
  const serverAdress = 'http://localhost:25679/';

  import { onMount } from 'svelte';
  import InfiniteScroll from './InfiniteScroll.svelte';

  let page = 0;
  let data = [];
  let newBatch = [];

  // server sends IDs
  async function fetchData() {
    const response = await fetch(`${serverAdress}annotations/pages/${page}`);
    newBatch = await response.json();
    page++;
    console.log(newBatch);
  }

  onMount(() => {
    // load first batch onMount
    fetchData();
  });

  $: data = [...data, ...newBatch];
</script>

<h1>Data Viewer</h1>
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
          <td
            ><img
              src={serverAdress + 'data/images/' + item.image_id}
              alt={item.label}
            /></td
          >
          <td>{item.image_id}</td>
          <td>{item.label}</td>
        </tr>
      {/each}
    </table>
    <InfiniteScroll
      hasMore={newBatch.length}
      threshold={100}
      on:loadMore={() => {
        fetchData();
      }}
    />
  </ul>
</main>

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
