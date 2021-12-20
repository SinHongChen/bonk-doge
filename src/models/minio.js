const Minio = require('minio')

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_HOST,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_SECURE === 'true',
    accessKey: process.env.MINIO_ROOT_USER,
    secretKey: process.env.MINIO_ROOT_PASSWORD
});

const buckets = {
    card: process.env.MINIO_BUCKET_CARD || "card",
}

for (let bucket in buckets) {
    minioClient.bucketExists(buckets[bucket]).then(exist => {
        if (!exist)
            minioClient.makeBucket(buckets[bucket]).catch(err => { console.log(err) });
    }).catch(error => { console.log(error) });
}

const listObject = (bucket, path) => {
    return new Promise((resolve, reject) => {
        const dataStream = minioClient.listObjectsV2(bucket, path);
        let list = [];
        dataStream.on('data', data => {
            list.push(data);
        })
        dataStream.on('end', () => {
            resolve(list);
        })
        dataStream.on('error', error => {
            console.log(error);
            reject('MINIO_LIST_OBJECT_ERROR');
        })
    })
}

const getPresignedUrl = (bucket, name) => {
    return new Promise((resolve, reject) => {
        minioClient.presignedUrl('GET', bucket, name, 24*60*60).then(url => {
            resolve(url);
        }).catch(error => { console.log(error); reject("MINIO_GET_PRESIGNEDURL_ERROR") })
    })
}

const uploadObject = (bucket, name, stream) => {
    return new Promise((resolve, reject) => {
        minioClient.putObject(bucket, name, stream).then(objInfo => {
            resolve(objInfo);
        }).catch(error => { console.log(error); reject("MINIO_UPLOAD_OBJECT_ERROR") })
    })
}

const deleteObject = (bucket, name) => {
    return new Promise((resolve, reject) => {
        minioClient.removeObject(bucket, name).then(() => {
            resolve('MINIO_OBJECT_DELETED');
        }).catch(error => { console.log(error); reject("MINIO_DELETE_OBJECT_ERROR") })
    })
}

module.exports = {
    minioClient,
    buckets,
    listObject,
    getPresignedUrl,
    uploadObject,
    deleteObject,
}
