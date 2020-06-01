const deleteProduct = (productId, csrfToken, event) => {
    fetch('/admin/product/' + productId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrfToken
        },
    })
        .then((result) => {
            return result.json()
        }).then(data => {
            if (data.message === 'success') {
                const productElement = event.target.closest('.p-2')
                const productParentElemnt = productElement.parentNode
                productElement.removeChild(productElement)
            }
        }).catch((err) => {
            console.log(err)
        });
}