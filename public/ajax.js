
$("#edit-list").on('click','.edit-button',function(){
    $(this).parent().parent().siblings('#form0').children(".edit-comment-form").toggle();
});
$('#edit-list').on('submit','.edit-comment-form',function(e){
    e.preventDefault();
    var comment=$(this).serialize();
    var actionUrl=$(this).attr('action');
    $originalItem=$(this).parent('#form0');
    $.ajax({
        url:actionUrl,
        data:comment,
        type:'PUT',
        originalItem:$originalItem,
        success:function(data){
            this.originalItem.html(
                `
                <div>
                         ${data.text}
                    </div>
                <form action="/campgrounds/${data._id}/comments/${data._id}" method="POST" class="edit-comment-form">
                    <div class="form-group">    <textarea class="form-control" style="border-radius: 20px; resize: vertical; "  name="comment[text]" >${data.text}</textarea></div>
                    <div class="text-right">
                        <div class="form-group"><button  class="btn btn-success">Update Comment</button> </div> 
                    </div>
                 </form>
                `
                )
        }
        
    });
});