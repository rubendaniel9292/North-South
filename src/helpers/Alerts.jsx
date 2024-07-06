import Swal from 'sweetalert2';
 const alerts = (title, message, ico) => {
    Swal.fire({
        title: title,
        text: message,
        icon: ico
    });
}

export default alerts;
