import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpEventType
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';
import { Injectable } from '@angular/core';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private requests: HttpRequest<any>[] = [];
  totalSize = 0;
  downloadedSize = 0;
  constructor(private loaderService: LoaderService) {}
  removeRequest(req: HttpRequest<any>) {
    const idx = this.requests.indexOf(req);
    if (idx >= 0) {
      this.requests.splice(idx, 1);
    }
    this.loaderService.progressReport.next(
      this.totalSize === 0
        ? null
        : ((this.downloadedSize / this.totalSize) * 100).toFixed(2)
    );
  }
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log(req);
    this.requests.push(req);

    return Observable.create(observer => {
      const subscription = next.handle(req).subscribe(
        event => {
          if (event instanceof HttpResponse) {
            this.removeRequest(req);
            observer.next(event);
          }
          if (event.type === HttpEventType.Response) {
            console.log(event);
          }
          if (event.type === HttpEventType.ResponseHeader) {
            console.log(event);
          }
          if (event.type === HttpEventType.DownloadProgress) {
            console.log(this.requests.indexOf(req));
            console.log(event.loaded);
            console.log(event.total);
          }
        },
        err => {
          this.removeRequest(req);
          observer.error(err);
        },
        () => {
          this.removeRequest(req);
          observer.complete();
        }
      );
      return () => {
        this.removeRequest(req);
        subscription.unsubscribe();
      };
    });
  }
}
