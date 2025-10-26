function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/' + proId,  // ✅ Fix: added '/' before proId
        method:'get',
        success:(response)=>{
            if (response.status) {
                let count=$('#cart-count').html() //is in string so convert by parseint to int
                count=parseInt(count)+1
                $("#cart-count").html(count)
            } 
        },
        error: (err) => {
            console.error("AJAX Error:", err); // ✅ Better debugging
        }
    })
}
