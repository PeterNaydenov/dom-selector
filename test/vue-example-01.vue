<template>
    <div>
        <h1>TITLE</h1>
        <p>Lorem ipsum dolor <span>sit</span> amet consectetur adipisicing elit. 
            Sint fuga necessitatibus, vero ea optio ipsa 
            repudiandae <a href="#">libero</a> excepturi blanditiis placeat 
            maxime? Iste, repudiandae? Quos <span>possimus</span> quis unde 
            maxime sequi similique alias rerum? Qui, debitis 
            explicabo quos rerum laudantium iste quod!</p>

        <p>Quos possimus quis unde maxime sequi similique 
            alias rerum</p>
    </div>
    <ul class="list">
        <li><a href="#">first link</a></li>
        <li><a href="#">second link</a></li>
        <li><a href="#"><span>third</span> link</a></li>
        <li><a href="#">forth link</a></li>
        <li><a href="#">fifth link</a></li>
    </ul>
    
    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. 
        Accusantium, cupiditate?</p>
    
    <ul class="nav">
        <li><a href="#">home</a></li>
        <li><a href="#">services</a></li>
        <li><a href="#"><span>about</span></a></li>
        <li><a href="#">contact</a></li>
    </ul>
</template>



<style scoped >
ul { font-family: Arial, Helvetica, sans-serif; }
li { display:block; padding: 0;}
a { text-decoration: none;  }



.nav {
        display: flex;
        padding:0;
        justify-content: center;
    }
.nav a,
.list a {
        display: block;
        padding: 1rem;
    }



.list {
        display: flex;
        flex-direction: column;
        list-style: none;
        padding: 0;
        margin-bottom: 3rem;
        row-gap: 10px;
    }
.list li {
        display: block;
        border: 1px solid #ccc;        
        &:hover { background-color: azure;}
    }
.nav li { 
        display: block;
        flex: 1 1 auto;
        text-align: center;
    }
</style>