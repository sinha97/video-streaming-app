import express from "express";
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path'
import fs from 'fs';
import { exec } from 'child_process'

const app = express();

// multer middleware

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads")
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + uuidv4() + path.extname(file.originalname))
    }
})

// multi configuration
const upload = multer({ storage: storage })

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true
}))

app.use((req, res, next) => {
    res.header("Accesse-Control-Allow-Origin", "*") //watch it
    res.header("Accesse-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accpet");
    next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use("/uploads", express.static("uploads"))

app.get('/', (req, res) => {
    res.json({ message: 'Hell Video streaming...' })
});

app.post("/uploads", upload.single("file"), function (req, res) {
    const videoId = uuidv4();
    const videoPath = req.file.path;
    const outputVideoPath = `./uploads/allvideos/${videoId}`;
    const hlsPath = `${outputVideoPath}/index.m3u8`;

    if (!fs.existsSync(outputVideoPath)) {
        fs.mkdirSync(outputVideoPath, { recursive: true })
    }

    // command to convert video to HLS format using ffmpeg

    const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputVideoPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;

    // run the ffmpeg command; usually done in a separate process (queued)
    exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        const videoUrl = `http://localhost:3000/uploads/allvideos/${videoId}/index.m3u8`;
        res.json({
            message: "Video converted to HLS format",
            videoUrl: videoUrl,
            lessonId: videoId,
        });

    })
});

app.listen(8001, () => {
    console.log('app is listen on port 8001')
})