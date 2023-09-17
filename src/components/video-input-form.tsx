import { FileVideo, Upload } from 'lucide-react';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { getFFmpeg } from '@/lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

function VideoInputForm() {
  // Variável, função para alterar o valor da variável (estado)
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Dentro do estado é onde iremos armazenar o vídeo selecionado
  // Estado é aquela variável, onde queremos monitorar a troca de valor dela, ou seja, se com
  // base em uma determinada variável queremos modificar alguma coisa na interface da
  // aplicação, então, essa variável é um estado

  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget;

    if (!files) {
      return;
    }

    const selectedFile = files[0];
    // Quando executamos o comando "currentTarget", sempre será retornado um array de
    // arquivos, porém só queremos pegar um arquivo, por isso colocamos files[0]

    setVideoFile(selectedFile);
  }

  async function convertVideoToAudio(video: File) {
    console.log('Convert started');

    const ffmpeg = await getFFmpeg();

    await ffmpeg.writeFile('input.mp4', await fetchFile(video));

    // ffmpeg.on('log', (log) => {
    //   console.log(log);
    // });

    ffmpeg.on('progress', (progress) => {
      console.log('Convert progress: ' + Math.round(progress.progress * 100));
    });

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3',
    ]);

    const data = await ffmpeg.readFile('output.mp3');

    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' });
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg',
    });

    console.log('Convert finished');

    return audioFile;
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Comando para evitar que a tela seja recarregada

    const prompt = promptInputRef.current?.value;

    if (!videoFile) {
      return;
    }

    // converter o vídeo em aúdio

    const audioFile = await convertVideoToAudio(videoFile);

    console.log(audioFile, prompt);
  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null;
    }

    return URL.createObjectURL(videoFile); // Criando uma URL de pré visualização do arquivo.
  }, [videoFile]);

  // A variável previewURL vai ser recriada novamente somente se a variável "videoFile" mudar,
  // por isso a mesma é passada no array de dependências, pois estamos monitorando a mesma

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        htmlFor="video"
        className="
          relative
          border 
          flex 
          rounded-md 
          aspect-video 
          cursor-pointer 
          border-dashed
          text-sm
          flex-col
          gap-2
          items-center
          justify-center
          text-muted-foreground
          hover:bg-primary/5"
      >
        {previewURL ? (
          <video
            src={previewURL}
            controls={false}
            className="pointer-events-none absolute inset-0"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Selecione um vídeo
          </>
        )}
      </label>

      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={handleFileSelected}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>

        <Textarea
          ref={promptInputRef}
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras chaves mencionadas no vídeo separadas por vírgula (,)"
        />
      </div>

      <Button type="submit" className="w-full">
        Carregar vídeo
        <Upload className="w-4 h-4 ml-2" />
      </Button>
    </form>
  );
}

export { VideoInputForm };
