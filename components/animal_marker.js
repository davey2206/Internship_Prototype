export default {
  template: `
            <div :style="containerStyle">
              <div
                v-if="isVisible"
                :data-marker-id="track_data.id"
                :style="markerStyle"
                data-clickable-marker="true"
                @marker-click="onMarkerClick"
                @touchstart="startCesiumDrag"
                @touchend="handleClick"
              >
            <div :style="animalMarkerImageContainer">
            <!-- Render group members side by side with offsets -->
            <template v-if="is_group">
              <div
                v-for="(member, index) in group_members"
                :key="index"
                :data-marker-id="member.track_data.id"
                :style="groupedImageStyle(index)"
                class="groupMember"
              >
                <!-- Marker Image -->
                <img
                  :src="member.track_data.animal.picture"
                  alt="Animal"
                  :style="groupedImageContentStyle(index)"
                />

                <div v-if="!member.track_data.animal.is_active" class="marker-battery-warning">
                  <img :src="pluginDirUrl + '/media/battery_empty_battery.png'" alt="Low Battery" />
                </div>

                <!-- Lock Overlay for Non-Owned Animals -->
                <div
                  v-if="!member.track_data.animal.is_owned"
                  style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    pointer-events: none;
                  "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 337 508"
                    style="width: 70%; height: 70%; opacity: 1;"
                  >
                    <g transform="translate(50, 50) scale(0.7)">
                        <path fill="#222" d="M0 0L337 0L337 508.562C336.815 508.678 336.631 508.777 336.423 508.847C334.787 509.395 319.001 509.008 316.177 509.009C301.353 509.014 286.408 509.417 271.596 508.984C270.974 508.965 270.538 508.915 269.984 508.618C269.893 508.666 269.804 508.719 269.711 508.763C268.449 509.357 226.272 509.001 221.421 509.002L112.772 509.007C108.062 509.007 70.5896 509.527 68.4592 508.686C68.3063 508.756 68.167 508.828 68.0055 508.873C66.066 509.414 52.372 509.009 49.4634 509.01L17.9304 509.009C12.5227 509.007 7.07612 509.139 1.67225 508.982C1.01255 508.963 0.567652 508.921 0 508.562L0 0ZM0 0L0 508.562C0.567652 508.921 1.01255 508.963 1.67225 508.982C7.07612 509.139 12.5227 509.007 17.9304 509.009L49.4634 509.01C52.372 509.009 66.066 509.414 68.0055 508.873C68.167 508.828 68.3063 508.756 68.4592 508.686C67.7576 508.718 67.7718 508.614 67.2659 508.171C67.2221 508.188 67.179 508.208 67.1344 508.223C66.1711 508.553 64.8163 508.198 63.8261 508.05C56.3059 506.925 48.7358 504.071 42.0189 500.542C38.7947 498.849 32.1779 495.071 29.5244 492.8C27.7998 491.325 26.329 489.3 24.7999 487.616C22.2199 484.775 19.5367 481.997 17.1953 478.949C13.4419 474.062 8.85313 466.055 7.02021 460.15C2.61144 445.946 3.50181 437.455 2.90248 423.31C2.70562 418.663 1.73532 414.089 1.54638 409.483C1.30658 403.638 1.50259 397.708 1.50031 391.855C1.49698 383.28 1.38374 374.686 1.54126 366.113C1.59789 363.031 2.84182 361.318 2.98075 358.813C3.41344 351.013 3.13274 342.966 3.07125 335.142C3.04873 332.276 3.09295 329.363 2.71981 326.518C2.41071 324.161 1.77183 321.833 1.59107 319.463C1.31611 315.857 1.48972 312.141 1.49402 308.524C1.49698 306.032 1.28522 303.297 1.56809 300.829C1.63697 300.228 1.92854 299.695 2.21077 299.17C2.28558 299.03 2.36845 298.896 2.44634 298.758C3.43992 297.004 3.42152 291.164 3.80537 288.791Q4.47134 284.878 5.4046 281.019C7.21676 273.645 10.7436 267.478 14.8754 261.191C15.9591 259.542 17.0169 257.706 18.2893 256.201C22.3655 251.379 35.9663 240.888 41.6225 237.872C43.5281 236.856 45.6821 236.093 47.7524 235.48C52.9589 233.939 59.223 232.83 64.6427 232.531C68.254 232.332 71.9512 232.469 75.5708 232.484L97.776 232.594L183.202 232.552C207.919 232.566 232.667 231.498 257.382 232.381C262.454 232.562 267.677 232.306 272.716 232.784C281.838 233.65 290.778 235.833 298.866 240.267C310.068 246.409 316.798 252.281 323.806 262.762C328.016 269.058 331.01 275.368 333.131 282.655Q334.727 288.243 335.107 294.043C335.399 298.424 335.308 302.869 335.335 307.262L335.389 330.792C335.395 335.477 335.362 340.17 335.506 344.853C335.647 349.411 335.97 353.967 335.992 358.527C336.042 368.903 335.544 379.301 335.441 389.68L335.392 418.931C335.346 426.368 335.368 434.246 334.238 441.597C332.694 451.64 330.591 455.611 326.33 464.601C325.184 467.018 324.276 469.545 322.988 471.895C317.926 481.135 304.18 495.226 294.907 500.495C291.591 502.379 282.986 505.67 279.216 506.761C277.212 507.341 272.644 508.826 270.783 508.142C270.506 508.339 270.306 508.508 269.984 508.618C270.538 508.915 270.974 508.965 271.596 508.984C286.408 509.417 301.353 509.014 316.177 509.009C319.001 509.008 334.787 509.395 336.423 508.847C336.631 508.777 336.815 508.678 337 508.562L337 0L0 0ZM165.466 287.579C165.398 287.62 165.331 287.662 165.263 287.703C163.392 288.808 157.706 288.4 155.081 288.876C150.176 289.766 146.372 291.579 142.021 293.904C131.64 299.451 125.939 304.525 122.79 316.282C119.313 329.261 119.617 342.48 126.47 354.348C130.083 360.605 136.494 367.324 142.928 370.711C144.956 371.779 148.196 372.739 149.752 374.362C150.348 374.984 150.473 376.91 150.554 377.731C151.204 384.289 150.851 391.175 150.843 397.763L150.615 437.974C150.617 441.411 150.018 449.183 150.728 451.95C151.216 453.853 152.602 454.833 154.416 455.303C156.636 455.879 171.288 456.075 172.747 455.281C172.788 455.258 172.83 455.238 172.871 455.216C174.293 456.078 182.946 455.374 184.827 454.917C185.506 454.753 186.055 454.594 186.514 454.033C188.137 449.468 187.283 406.415 186.976 400.201C186.695 394.518 183.925 388.32 185.706 382.575C185.928 381.856 186.418 381.28 186.686 380.566C186.639 378.834 186.08 374.285 187.343 372.968C188.97 371.271 192.187 370.961 194.214 369.672C205.388 362.567 213.772 352.306 214.267 338.599C214.728 325.819 215.097 318.806 207.167 307.863C205.522 305.593 203.898 303.199 201.986 301.147C195.516 294.202 186.239 290.308 177.002 288.781C175.085 288.464 173.133 288.468 171.206 288.249C170.014 288.114 168.874 287.601 167.695 287.547C166.957 287.514 166.203 287.55 165.466 287.579ZM67.2659 508.171C67.7718 508.614 67.7576 508.718 68.4592 508.686C70.5896 509.527 108.062 509.007 112.772 509.007L221.421 509.002C226.272 509.001 268.449 509.357 269.711 508.763C269.804 508.719 269.893 508.666 269.984 508.618C270.306 508.508 270.506 508.339 270.783 508.142C268.653 508.978 265.172 508.839 262.878 508.861C254.285 508.941 245.701 508.545 237.109 508.563L112.642 508.484C102.561 508.439 92.4937 508.73 82.415 508.765C78.2101 508.78 71.1283 509.209 67.2659 508.171Z"/>
                        <path fill="#222" fill-opacity="0.63137257" d="M67.2659 508.171C71.1283 509.209 78.2101 508.78 82.415 508.765C92.4937 508.73 102.561 508.439 112.642 508.484L237.109 508.563C245.701 508.545 254.285 508.941 262.878 508.861C265.172 508.839 268.653 508.978 270.783 508.142C270.506 508.339 270.306 508.508 269.984 508.618C269.893 508.666 269.804 508.719 269.711 508.763C268.449 509.357 226.272 509.001 221.421 509.002L112.772 509.007C108.062 509.007 70.5896 509.527 68.4592 508.686C67.7576 508.718 67.7718 508.614 67.2659 508.171Z"/>
                        <path d="M90.7845 201.674C91.0538 203.762 91.9562 212.541 90.9268 214.116C90.439 214.287 89.9744 214.425 89.4673 214.526C89.9665 210.199 90.6938 206.037 90.7845 201.674Z"/>
                        <path d="M287.922 86.6525C291.089 92.909 294.52 110.056 294.448 117.052C293.707 115.664 293.804 113.06 293.457 111.457C292.161 105.482 290.538 99.5598 289.254 93.5713C288.767 91.2997 288.146 88.9651 287.922 86.6525Z"/>
                        <path fill="#222" d="M42.6135 214.004C42.6645 212.324 42.7016 210.55 42.4409 208.887C42.1488 207.023 41.4783 204.966 41.513 203.093C41.5442 201.408 42.3218 199.566 42.4662 197.806C42.9797 191.547 43.1132 185.404 43.1071 179.129C43.098 169.761 43.1286 160.325 42.925 150.963C42.8092 145.64 42.297 140.395 42.3888 135.054C42.8019 111.03 47.4078 87.0968 58.7909 65.7615C65.3633 53.443 74.7138 42.6751 85.0818 33.3975C86.4581 32.1659 88.0234 31.1619 89.4061 29.9442C90.9785 28.5592 92.2475 26.7119 93.938 25.4832C95.6177 24.2623 97.8027 23.6905 99.5832 22.606C103.946 19.9485 108.024 16.6892 112.51 14.2245C116.414 12.08 125.905 8.98173 130.386 7.61883C149.359 1.84918 173.163 0.58623 192.638 4.41116C203.92 6.62706 215.563 10.8859 225.685 16.2981C247.221 27.813 265.302 43.6028 277.886 64.6488C282.147 71.7761 285.496 78.6659 287.922 86.6525C288.146 88.9651 288.767 91.2997 289.254 93.5713C290.538 99.5598 292.161 105.482 293.457 111.457C293.804 113.06 293.707 115.664 294.448 117.052C294.911 127.507 294.763 137.976 294.746 148.437C294.73 158.887 294.845 169.314 294.732 179.768C294.605 191.458 294.918 203.137 294.485 214.822C290.378 214.244 285.829 214.694 281.665 214.71Q269.657 214.767 257.65 214.644C253.65 214.617 249.337 215.017 245.471 213.861C244.809 205.9 245.463 197.65 245.471 189.645L245.406 143.053C245.471 129.733 246.407 115.928 242.526 103.011C238.74 90.4097 228.358 75.9184 218.316 67.4229C214.537 64.2261 210.408 61.9564 206.047 59.674C198.276 55.6062 188.208 51.6688 179.456 50.8332C176.218 50.524 172.913 50.6767 169.661 50.6474C165.662 50.6114 161.663 50.5138 157.674 50.8541C151.328 51.3956 144.663 52.8138 138.704 55.0492C136.567 55.8509 134.611 57.1132 132.582 58.1453C123.653 62.6863 115.907 67.6703 109.39 75.4425C103.769 82.1474 100.77 86.4546 97.0266 94.4153C95.9645 96.6737 94.8534 98.9075 94.0949 101.291C90.0177 114.102 90.6943 139.019 90.6432 153.27C90.6205 159.618 90.2279 166.209 90.8027 172.522C91.151 176.347 91.4958 180.061 91.4027 183.908C91.2579 189.897 90.5296 195.65 90.7845 201.674C90.6938 206.037 89.9665 210.199 89.4673 214.526C84.7363 214.851 79.9176 214.514 75.1707 214.634C72.3856 214.704 69.6546 215.247 66.8811 215.367C63.6998 215.505 60.5457 215.078 57.3742 214.979C55.3321 214.915 53.2877 215.111 51.2439 215.02C48.3636 214.891 45.542 214.119 42.6135 214.004Z"/>
                    </g>
                  </svg>
                </div>
              </div>
            </template>
            <img v-if="!is_group" :src="track_data.animal.picture" alt="Animal" :style="imageStyle" />
            <div v-if="!is_group && !track_data.animal.is_active" class="marker-battery-warning">
              <img :src="pluginDirUrl + '/media/battery_empty_battery.png'" alt="Low Battery" />
            </div>
            <div v-if="!track_data.animal.is_owned" :style="svgOverlayStyle">
                <svg
                :style="svgStyle"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 337 508"
                >
                    <g transform="translate(50, 50) scale(0.7)">
                        <path fill="#222" d="M0 0L337 0L337 508.562C336.815 508.678 336.631 508.777 336.423 508.847C334.787 509.395 319.001 509.008 316.177 509.009C301.353 509.014 286.408 509.417 271.596 508.984C270.974 508.965 270.538 508.915 269.984 508.618C269.893 508.666 269.804 508.719 269.711 508.763C268.449 509.357 226.272 509.001 221.421 509.002L112.772 509.007C108.062 509.007 70.5896 509.527 68.4592 508.686C68.3063 508.756 68.167 508.828 68.0055 508.873C66.066 509.414 52.372 509.009 49.4634 509.01L17.9304 509.009C12.5227 509.007 7.07612 509.139 1.67225 508.982C1.01255 508.963 0.567652 508.921 0 508.562L0 0ZM0 0L0 508.562C0.567652 508.921 1.01255 508.963 1.67225 508.982C7.07612 509.139 12.5227 509.007 17.9304 509.009L49.4634 509.01C52.372 509.009 66.066 509.414 68.0055 508.873C68.167 508.828 68.3063 508.756 68.4592 508.686C67.7576 508.718 67.7718 508.614 67.2659 508.171C67.2221 508.188 67.179 508.208 67.1344 508.223C66.1711 508.553 64.8163 508.198 63.8261 508.05C56.3059 506.925 48.7358 504.071 42.0189 500.542C38.7947 498.849 32.1779 495.071 29.5244 492.8C27.7998 491.325 26.329 489.3 24.7999 487.616C22.2199 484.775 19.5367 481.997 17.1953 478.949C13.4419 474.062 8.85313 466.055 7.02021 460.15C2.61144 445.946 3.50181 437.455 2.90248 423.31C2.70562 418.663 1.73532 414.089 1.54638 409.483C1.30658 403.638 1.50259 397.708 1.50031 391.855C1.49698 383.28 1.38374 374.686 1.54126 366.113C1.59789 363.031 2.84182 361.318 2.98075 358.813C3.41344 351.013 3.13274 342.966 3.07125 335.142C3.04873 332.276 3.09295 329.363 2.71981 326.518C2.41071 324.161 1.77183 321.833 1.59107 319.463C1.31611 315.857 1.48972 312.141 1.49402 308.524C1.49698 306.032 1.28522 303.297 1.56809 300.829C1.63697 300.228 1.92854 299.695 2.21077 299.17C2.28558 299.03 2.36845 298.896 2.44634 298.758C3.43992 297.004 3.42152 291.164 3.80537 288.791Q4.47134 284.878 5.4046 281.019C7.21676 273.645 10.7436 267.478 14.8754 261.191C15.9591 259.542 17.0169 257.706 18.2893 256.201C22.3655 251.379 35.9663 240.888 41.6225 237.872C43.5281 236.856 45.6821 236.093 47.7524 235.48C52.9589 233.939 59.223 232.83 64.6427 232.531C68.254 232.332 71.9512 232.469 75.5708 232.484L97.776 232.594L183.202 232.552C207.919 232.566 232.667 231.498 257.382 232.381C262.454 232.562 267.677 232.306 272.716 232.784C281.838 233.65 290.778 235.833 298.866 240.267C310.068 246.409 316.798 252.281 323.806 262.762C328.016 269.058 331.01 275.368 333.131 282.655Q334.727 288.243 335.107 294.043C335.399 298.424 335.308 302.869 335.335 307.262L335.389 330.792C335.395 335.477 335.362 340.17 335.506 344.853C335.647 349.411 335.97 353.967 335.992 358.527C336.042 368.903 335.544 379.301 335.441 389.68L335.392 418.931C335.346 426.368 335.368 434.246 334.238 441.597C332.694 451.64 330.591 455.611 326.33 464.601C325.184 467.018 324.276 469.545 322.988 471.895C317.926 481.135 304.18 495.226 294.907 500.495C291.591 502.379 282.986 505.67 279.216 506.761C277.212 507.341 272.644 508.826 270.783 508.142C270.506 508.339 270.306 508.508 269.984 508.618C270.538 508.915 270.974 508.965 271.596 508.984C286.408 509.417 301.353 509.014 316.177 509.009C319.001 509.008 334.787 509.395 336.423 508.847C336.631 508.777 336.815 508.678 337 508.562L337 0L0 0ZM165.466 287.579C165.398 287.62 165.331 287.662 165.263 287.703C163.392 288.808 157.706 288.4 155.081 288.876C150.176 289.766 146.372 291.579 142.021 293.904C131.64 299.451 125.939 304.525 122.79 316.282C119.313 329.261 119.617 342.48 126.47 354.348C130.083 360.605 136.494 367.324 142.928 370.711C144.956 371.779 148.196 372.739 149.752 374.362C150.348 374.984 150.473 376.91 150.554 377.731C151.204 384.289 150.851 391.175 150.843 397.763L150.615 437.974C150.617 441.411 150.018 449.183 150.728 451.95C151.216 453.853 152.602 454.833 154.416 455.303C156.636 455.879 171.288 456.075 172.747 455.281C172.788 455.258 172.83 455.238 172.871 455.216C174.293 456.078 182.946 455.374 184.827 454.917C185.506 454.753 186.055 454.594 186.514 454.033C188.137 449.468 187.283 406.415 186.976 400.201C186.695 394.518 183.925 388.32 185.706 382.575C185.928 381.856 186.418 381.28 186.686 380.566C186.639 378.834 186.08 374.285 187.343 372.968C188.97 371.271 192.187 370.961 194.214 369.672C205.388 362.567 213.772 352.306 214.267 338.599C214.728 325.819 215.097 318.806 207.167 307.863C205.522 305.593 203.898 303.199 201.986 301.147C195.516 294.202 186.239 290.308 177.002 288.781C175.085 288.464 173.133 288.468 171.206 288.249C170.014 288.114 168.874 287.601 167.695 287.547C166.957 287.514 166.203 287.55 165.466 287.579ZM67.2659 508.171C67.7718 508.614 67.7576 508.718 68.4592 508.686C70.5896 509.527 108.062 509.007 112.772 509.007L221.421 509.002C226.272 509.001 268.449 509.357 269.711 508.763C269.804 508.719 269.893 508.666 269.984 508.618C270.306 508.508 270.506 508.339 270.783 508.142C268.653 508.978 265.172 508.839 262.878 508.861C254.285 508.941 245.701 508.545 237.109 508.563L112.642 508.484C102.561 508.439 92.4937 508.73 82.415 508.765C78.2101 508.78 71.1283 509.209 67.2659 508.171Z"/>
                        <path fill="#222" fill-opacity="0.63137257" d="M67.2659 508.171C71.1283 509.209 78.2101 508.78 82.415 508.765C92.4937 508.73 102.561 508.439 112.642 508.484L237.109 508.563C245.701 508.545 254.285 508.941 262.878 508.861C265.172 508.839 268.653 508.978 270.783 508.142C270.506 508.339 270.306 508.508 269.984 508.618C269.893 508.666 269.804 508.719 269.711 508.763C268.449 509.357 226.272 509.001 221.421 509.002L112.772 509.007C108.062 509.007 70.5896 509.527 68.4592 508.686C67.7576 508.718 67.7718 508.614 67.2659 508.171Z"/>
                        <path d="M90.7845 201.674C91.0538 203.762 91.9562 212.541 90.9268 214.116C90.439 214.287 89.9744 214.425 89.4673 214.526C89.9665 210.199 90.6938 206.037 90.7845 201.674Z"/>
                        <path d="M287.922 86.6525C291.089 92.909 294.52 110.056 294.448 117.052C293.707 115.664 293.804 113.06 293.457 111.457C292.161 105.482 290.538 99.5598 289.254 93.5713C288.767 91.2997 288.146 88.9651 287.922 86.6525Z"/>
                        <path fill="#222" d="M42.6135 214.004C42.6645 212.324 42.7016 210.55 42.4409 208.887C42.1488 207.023 41.4783 204.966 41.513 203.093C41.5442 201.408 42.3218 199.566 42.4662 197.806C42.9797 191.547 43.1132 185.404 43.1071 179.129C43.098 169.761 43.1286 160.325 42.925 150.963C42.8092 145.64 42.297 140.395 42.3888 135.054C42.8019 111.03 47.4078 87.0968 58.7909 65.7615C65.3633 53.443 74.7138 42.6751 85.0818 33.3975C86.4581 32.1659 88.0234 31.1619 89.4061 29.9442C90.9785 28.5592 92.2475 26.7119 93.938 25.4832C95.6177 24.2623 97.8027 23.6905 99.5832 22.606C103.946 19.9485 108.024 16.6892 112.51 14.2245C116.414 12.08 125.905 8.98173 130.386 7.61883C149.359 1.84918 173.163 0.58623 192.638 4.41116C203.92 6.62706 215.563 10.8859 225.685 16.2981C247.221 27.813 265.302 43.6028 277.886 64.6488C282.147 71.7761 285.496 78.6659 287.922 86.6525C288.146 88.9651 288.767 91.2997 289.254 93.5713C290.538 99.5598 292.161 105.482 293.457 111.457C293.804 113.06 293.707 115.664 294.448 117.052C294.911 127.507 294.763 137.976 294.746 148.437C294.73 158.887 294.845 169.314 294.732 179.768C294.605 191.458 294.918 203.137 294.485 214.822C290.378 214.244 285.829 214.694 281.665 214.71Q269.657 214.767 257.65 214.644C253.65 214.617 249.337 215.017 245.471 213.861C244.809 205.9 245.463 197.65 245.471 189.645L245.406 143.053C245.471 129.733 246.407 115.928 242.526 103.011C238.74 90.4097 228.358 75.9184 218.316 67.4229C214.537 64.2261 210.408 61.9564 206.047 59.674C198.276 55.6062 188.208 51.6688 179.456 50.8332C176.218 50.524 172.913 50.6767 169.661 50.6474C165.662 50.6114 161.663 50.5138 157.674 50.8541C151.328 51.3956 144.663 52.8138 138.704 55.0492C136.567 55.8509 134.611 57.1132 132.582 58.1453C123.653 62.6863 115.907 67.6703 109.39 75.4425C103.769 82.1474 100.77 86.4546 97.0266 94.4153C95.9645 96.6737 94.8534 98.9075 94.0949 101.291C90.0177 114.102 90.6943 139.019 90.6432 153.27C90.6205 159.618 90.2279 166.209 90.8027 172.522C91.151 176.347 91.4958 180.061 91.4027 183.908C91.2579 189.897 90.5296 195.65 90.7845 201.674C90.6938 206.037 89.9665 210.199 89.4673 214.526C84.7363 214.851 79.9176 214.514 75.1707 214.634C72.3856 214.704 69.6546 215.247 66.8811 215.367C63.6998 215.505 60.5457 215.078 57.3742 214.979C55.3321 214.915 53.2877 215.111 51.2439 215.02C48.3636 214.891 45.542 214.119 42.6135 214.004Z"/>
                    </g>
                </svg>
            </div>
            </div>
            <div :style="animalMarkerLabelContainer">
            <div :style="animalMarkerNameLabel">{{ track_data.animal.name }}</div>
            </div>
        </div>
    </div>
  `,
  props: {
    track_data: {
      type: Object,
      required: true,
    },
    viewer: {
      type: Object,
      required: true,
    },
    polylineColor: {
      type: String,
      default: '#0F9CB9', // Default to the active polyline color
    },
    pluginDirUrl: {
      type: String,
      required: true,
    },
    is_group: {
      type: Boolean,
      default: false,
    },
    group_index: {
      type: Number,
      default: 0,
    },
    group_size: {
      type: Number,
      default: 1,
    },
    group_members: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      firstPosition: null,
      markerHeight: 64, // Height of the marker in pixels
      dotRadius: 5, // Radius of the location dot in pixels
      isVisible: false, // Control visibility
      polylineEntity: null, // Store the Cesium polyline entity
      logBuffer: [], // Initialize logBuffer to store log messages
      isZooming: false,
      dragged: false,
      initialTouchDistance: null,
      isTouchStart: false,
      touchStartTime: 0,
      lastLogFlush: Date.now(),
      isLogging: false,
    };
  },
  watch: {
    logBuffer: {
      handler(newBuffer) {
        // Check if buffer is getting large or if enough time has passed
        const now = Date.now();
        if (
          newBuffer.length >= 50 ||
          (now - this.lastLogFlush > 5000 && newBuffer.length > 0)
        ) {
          this.flushLogs();
        }
      },
      deep: true,
    },
  },
  errorCaptured(err, vm, info) {
    console.error(`[Component Error]: ${err.toString()}\nInfo: ${info}`);
    return false; // Prevents the error from propagating to parent components
  },
  mounted() {
    this.createPolyline(); // Create the polyline in 3D space
    this.updatePosition(); // Initial position update

    // Use postRender to update frequently
    this.viewer.scene.postRender.addEventListener(this.updatePosition);
  },
  beforeDestroy() {
    // Remove the postRender listener
    this.viewer.scene.postRender.removeEventListener(this.updatePosition);

    // Remove the polyline if it exists
    if (this.polylineEntity) {
      this.viewer.entities.remove(this.polylineEntity);
      this.logWithThrottle('Polyline Entity destroyed..');
    }

    if (this.logBuffer.length > 0) {
      this.flushLogs();
    }
  },
  methods: {
    formatLogMessage(data) {
      return `[${new Date().toISOString()}] Marker ${
        this.track_data.id
      }: ${JSON.stringify(data)}`;
    },

    // Log method with automatic flushing
    log(data) {
      const logMessage = this.formatLogMessage(data);
      this.logBuffer.push(logMessage);

      // Flush if buffer gets too large (around 100KB to be safe)
      if (this.getBufferSize() > 100000) {
        // 100KB
        this.flushLogs();
      }
    },

    // Calculate approximate buffer size
    getBufferSize() {
      return this.logBuffer.reduce((size, log) => size + log.length * 2, 0); // * 2 for UTF-16
    },

    // Throttled logging method
    logWithThrottle: function (data) {
      if (!this.isLogging) return;

      const throttledLog = window.lodash.throttle(() => {
        this.log(data);
      }, 100); // Throttle to max once per 100ms

      throttledLog();
    },
    getLogUrl() {
      const baseUrl = window.location.origin;
      const pluginPath =
        '/wp-content/plugins/kukudushi-engine-vue/components/log.php';
      return `${baseUrl}${pluginPath}`;
    },

    // Improved log flushing
    async flushLogs() {
      if (this.logBuffer.length === 0) return;

      const logsToSend = [...this.logBuffer];

      try {
        const logUrl = this.getLogUrl();
        console.log('Sending logs to:', logUrl);

        // Format logs in a way that PHP expects
        const formattedLogs = logsToSend.map((log) => {
          if (typeof log === 'string') return log;
          return JSON.stringify(log);
        });

        const formData = new URLSearchParams();
        formData.append('logs', JSON.stringify(formattedLogs));

        const response = await fetch(logUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          credentials: 'same-origin',
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const responseText = await response.text();
          console.error('Server response:', responseText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Clear buffer only on success
        this.logBuffer = [];
        this.lastLogFlush = Date.now();
        console.log('Logs successfully sent');
      } catch (error) {
        console.error('Log flush error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        // Keep the failed logs in buffer
        this.logBuffer = [...logsToSend, ...this.logBuffer].slice(-1000); // Prevent buffer from growing too large
      }
    },
    getFirstPosition() {
      return this.track_data.positions[0];
    },
    createPolyline() {
      // Create the polyline entity in Cesium
      this.polylineEntity = this.viewer.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            return [
              this.getFirstPosition().position, // Ground position (dot location)
              this.calculateMarkerCartesian(), // Elevated marker position
            ];
          }, false),
          width: 2, // Set a fixed width for better visibility
          material: Cesium.Color.fromCssColorString(this.polylineColor), // Remove the glow effect
          clampToGround: false, // Ensure the line is drawn in 3D space
          show: true, // Ensure the polyline is always visible
        },
      });
    },
    calculateMarkerCartesian() {
      // Calculate the marker's position in 3D space based on camera distance
      const cartographic = Cesium.Cartographic.fromCartesian(
        this.getFirstPosition().position
      );

      // Calculate camera distance from the ground at the marker's position
      const cameraDistance = Cesium.Cartesian3.distance(
        this.viewer.camera.positionWC,
        this.getFirstPosition().position
      );

      // Adjust multiplier to scale the marker height appropriately
      const heightAboveGround = cameraDistance * 0.065;

      const markerCartographic = new Cesium.Cartographic(
        cartographic.longitude,
        cartographic.latitude,
        cartographic.height + heightAboveGround
      );

      return Cesium.Cartesian3.fromRadians(
        markerCartographic.longitude,
        markerCartographic.latitude,
        markerCartographic.height
      );
    },
    updatePosition() {
      if (!this.$el) {
        console.warn('Marker element is not defined:', this.$el);
        return;
      }

      // Retrieve the point entity based on its ID
      //const pointEntity = this.viewer.entities.getById(this.id);
      const pointEntity = this.getFirstPosition();

      if (pointEntity) {
        // Determine if the point entity's show property is a function or a direct value
        let isVisible;
        if (
          Cesium.defined(pointEntity.show) &&
          typeof pointEntity.show.getValue === 'function'
        ) {
          isVisible = pointEntity.show.getValue(this.viewer.clock.currentTime);
        } else {
          isVisible = pointEntity.show;
        }

        this.isVisible = isVisible;

        if (this.isVisible) {
          // Position the HTML marker if visible
          const screenPosition =
            Cesium.SceneTransforms.wgs84ToWindowCoordinates(
              this.viewer.scene,
              this.calculateMarkerCartesian()
            );

          if (screenPosition) {
            this.$el.style.left = `${screenPosition.x}px`;
            this.$el.style.top = `${screenPosition.y}px`;
          }

          // Ensure the polyline is visible
          if (this.polylineEntity) {
            this.polylineEntity.show = true;
          }
        } else {
          // Hide the polyline and marker if the point is not visible
          if (this.polylineEntity) {
            this.polylineEntity.show = false;
          }
        }
      } else {
        console.warn(
          'Point entity not found with ID:',
          this.getFirstPosition().id
        );
        this.isVisible = false;

        if (this.polylineEntity) {
          this.polylineEntity.show = false;
        }
      }
    },
    handleExternalClick() {
      // Skip if dragging or zooming
      if (this.dragged || this.isZooming) {
        this.logWithThrottle(
          'External click suppressed due to drag/zoom state'
        );
        return;
      }

      this.onMarkerClick();
    },
    onMarkerClick() {
      if (this.is_group) {
        this.$emit('zoom-to-group', this.group_members);
      } else {
        this.$emit('child-marker-clicked', this.track_data.animal);
      }
    },
    handleClick(event) {
      // Prevent default behavior
      event.preventDefault();

      const touchDuration = Date.now() - this.touchStartTime;
      if (!this.dragged && !this.isZooming && touchDuration < 400) {
        this.onMarkerClick();
      }

      // Reset states
      this.dragged = false;
      this.isZooming = false;
      this.isTouchStart = false;
      this.touchStartTime = 0;
    },
    startCesiumDrag(event) {
      event.preventDefault();
      this.isTouchStart = true;
      this.touchStartTime = Date.now();
      this.isLogging = true;

      if (event.touches && event.touches.length > 1) {
        this.handlePinchStart(event);
        return;
      }

      const startMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };

      this.dragged = false;
      let isDragging = true;

      // Add a margin for detecting a drag versus a click
      const dragThreshold = 10; // Adjust this value as needed

      // Disable default Cesium input handling during drag
      const controller = this.viewer.scene.screenSpaceCameraController;
      controller.enableRotate = false;
      controller.enableTranslate = false;
      controller.enableZoom = false;
      controller.enableTilt = false;
      controller.enableLook = false;

      const onMove = (moveEvent) => {
        if (!isDragging || this.isZooming) return;

        // Detect if a second touch starts
        if (moveEvent.touches.length > 1) {
          isDragging = false; // End drag detection
          document.removeEventListener('touchmove', onMove);
          this.handlePinchStart(moveEvent);
          return;
        }

        const currentX = moveEvent.touches[0].clientX;
        const currentY = moveEvent.touches[0].clientY;

        // Check if the movement exceeds the drag threshold
        if (
          !this.dragged &&
          (Math.abs(currentX - startMousePosition.x) > dragThreshold ||
            Math.abs(currentY - startMousePosition.y) > dragThreshold)
        ) {
          this.dragged = true;
        }

        // If it's still within the threshold, treat it as a click and don't drag
        if (!this.dragged) return;

        // Get current camera height in meters
        const cameraHeight = this.viewer.camera.positionCartographic.height;

        // Calculate move rate using a custom curve based on camera height
        const moveRate = this.calculateMoveRate(cameraHeight);

        // Log values for analysis
        this.log({
          event: 'drag',
          cameraHeight,
          moveRate,
          baseMove: currentX - startMousePosition.x,
          adjustedMove: (currentX - startMousePosition.x) * moveRate,
        });

        // Apply the height-adjusted movement multiplier
        const deltaX = (currentX - startMousePosition.x) * moveRate;
        const deltaY = (currentY - startMousePosition.y) * moveRate;

        const camera = this.viewer.camera;
        const right = Cesium.Cartesian3.normalize(
          camera.right,
          new Cesium.Cartesian3()
        );
        const up = Cesium.Cartesian3.normalize(
          camera.up,
          new Cesium.Cartesian3()
        );

        // Rotate camera based on drag movement
        camera.rotate(up, deltaX);
        camera.rotate(right, deltaY);

        startMousePosition.x = currentX;
        startMousePosition.y = currentY;

        camera.pitch = camera.pitch;
      };

      const onEnd = () => {
        isDragging = false;
        this.isLogging = false;

        // If the user didn't drag, it might be a click
        if (!this.dragged) {
          this.log({
            event: 'click',
            duration: Date.now() - this.touchStartTime,
          });
        }

        // Final log entry for this drag session
        this.log({
          event: 'dragEnd',
          dragDuration: Date.now() - this.touchStartTime,
        });

        // Restore default Cesium input handling
        controller.enableRotate = true;
        controller.enableTranslate = true;
        controller.enableZoom = true;
        controller.enableTilt = true;
        controller.enableLook = true;

        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);

        // Cleanup
        this.dragged = false;
        this.isZooming = false;
        this.isTouchStart = false;
        this.touchStartTime = 0;

        // Ensure logs are flushed at end of drag
        this.flushLogs();
      };

      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd, { passive: false });
    },
    // Helper function to calculate move rate based on height
    calculateMoveRate(cameraHeight) {
      const MIN_HEIGHT = 50000; // 50.000m / 50km - very close
      const MAX_HEIGHT = 20000000; // 20.000.000m / 20,000km - very far

      const MIN_MOVE_RATE = 0.000012; // Very fine control when close
      const MAX_MOVE_RATE = 0.004; // Fast movement when far

      if (cameraHeight <= MIN_HEIGHT) {
        return MIN_MOVE_RATE;
      } else if (cameraHeight >= MAX_HEIGHT) {
        return MAX_MOVE_RATE;
      } else {
        // Scale the move rate linearly between MIN and MAX heights
        return (
          MIN_MOVE_RATE +
          ((cameraHeight - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT)) *
            (MAX_MOVE_RATE - MIN_MOVE_RATE)
        );
      }
    },
    handlePinchStart(event) {
      this.isZooming = true;
      this.dragged = false;
      this.initialTouchDistance = this.calculateDistanceBetweenTouches(
        event.touches
      );

      // Log initial state
      this.log({
        event: 'pinchStart',
        initialDistance: this.initialTouchDistance,
        timestamp: Date.now(),
      });

      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const screenMidpoint = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      // Pick the focal point on the globe
      const globeFocusPoint = this.viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(screenMidpoint.x, screenMidpoint.y),
        this.viewer.scene.globe.ellipsoid
      );

      if (!globeFocusPoint) {
        this.log({
          event: 'pinchError',
          error: 'No focus point found on globe',
          screenMidpoint,
        });
        return;
      }

      const camera = this.viewer.camera;

      // Log initial camera state
      this.log({
        event: 'cameraInitialState',
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
        height: camera.positionCartographic.height,
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        },
      });

      // Disable default touch input during custom handling
      const controller = this.viewer.scene.screenSpaceCameraController;
      controller.enableRotate = false;
      controller.enableTranslate = false;
      controller.enableZoom = false;
      controller.enableTilt = false;
      controller.enableLook = false;

      // Save the focal point's transform
      const transform =
        Cesium.Transforms.eastNorthUpToFixedFrame(globeFocusPoint);

      // Save the initial angle and midpoint
      const initialAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );
      const initialMidY = (touch1.clientY + touch2.clientY) / 2;

      // Save the initial camera state
      const initialCameraHeight = camera.positionCartographic.height;
      const initialHeading = camera.heading;
      const initialViewMatrix = camera.viewMatrix;

      // Log transform application
      this.log({
        event: 'preTransform',
        initialHeading,
        initialHeight: initialCameraHeight,
        initialAngle,
        initialMidY,
      });

      // Apply transform while preserving orientation
      camera.lookAtTransform(transform, undefined, initialHeading);

      // Log post-transform state
      this.log({
        event: 'postTransform',
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
      });

      const onPinchMove = (moveEvent) => {
        if (moveEvent.touches && moveEvent.touches.length > 1) {
          const currentTouchDistance = this.calculateDistanceBetweenTouches(
            moveEvent.touches
          );
          if (!currentTouchDistance) return;

          // Calculate the zoom factor
          const zoomDelta = currentTouchDistance - this.initialTouchDistance;
          const zoomFactor = 1 + (zoomDelta / this.initialTouchDistance) * 1.0;

          // Adjust the camera height for zooming
          const newHeight = initialCameraHeight / zoomFactor;

          // Calculate the current angle and midpoint
          const touch1 = moveEvent.touches[0];
          const touch2 = moveEvent.touches[1];
          const currentAngle = Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
          );
          const currentMidY = (touch1.clientY + touch2.clientY) / 2;

          // Compute rotation and tilt deltas
          const rotationDelta = currentAngle - initialAngle;
          const tiltDelta = (currentMidY - initialMidY) * 0.002;

          // Log pre-move state
          this.log({
            event: 'pinchMove',
            zoomDelta,
            zoomFactor,
            newHeight,
            rotationDelta,
            tiltDelta,
            currentHeading: camera.heading,
          });

          // Apply zoom while maintaining heading
          const pitch = camera.pitch;
          camera.lookAtTransform(
            transform,
            new Cesium.HeadingPitchRange(initialHeading, pitch, newHeight)
          );

          // Apply rotation
          camera.rotate(Cesium.Cartesian3.UNIT_Z, rotationDelta, {
            relativeToCamera: true,
          });

          // Log post-move state
          this.log({
            event: 'postMove',
            heading: camera.heading,
            pitch: camera.pitch,
            roll: camera.roll,
          });
        }
      };

      const onPinchEnd = () => {
        // Log pre-end state
        this.log({
          event: 'pinchEnd',
          preEndHeading: camera.heading,
          preEndPitch: camera.pitch,
          preEndRoll: camera.roll,
        });

        this.isZooming = false;

        // Restore default touch input handling
        controller.enableRotate = true;
        controller.enableTranslate = true;
        controller.enableZoom = true;
        controller.enableTilt = true;
        controller.enableLook = true;

        // Restore free camera movement while maintaining final orientation
        const finalHeading = camera.heading;
        camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        camera.setView({
          orientation: {
            heading: finalHeading,
            pitch: camera.pitch,
            roll: camera.roll,
          },
        });

        // Log final state
        this.log({
          event: 'finalState',
          finalHeading,
          finalPitch: camera.pitch,
          finalRoll: camera.roll,
        });

        document.removeEventListener('touchmove', onPinchMove);
        document.removeEventListener('touchend', onPinchEnd);

        // Ensure logs are flushed
        this.flushLogs();
      };

      document.addEventListener('touchmove', onPinchMove, { passive: false });
      document.addEventListener('touchend', onPinchEnd);
    },
    calculateDistanceBetweenTouches(touches) {
      if (!touches || touches.length < 2) return undefined;

      const [touch1, touch2] = touches;
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },
  },
  computed: {
    containerStyle() {
      return {
        position: 'absolute',
        pointerEvents: 'none', // Prevent interactions with the container
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      };
    },
    markerStyle() {
      return {
        position: 'absolute',
        zIndex: 2, // Place marker above the line
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        /*width: 'max-content',*/
        width: `${
          this.is_group ? 64 + (this.group_members.length - 1) * 38 : 64
        }px`, // Adjust width for group
        transform: 'translateY(-100%)', // Position marker above the dot
        cursor: 'pointer', // Indicate the marker is clickable
      };
    },
    markerBatteryStyle() {
      return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '70%',
        height: '70%',
        zIndex: 2,
        pointerEvents: 'none',
        animation: 'markerBatteryFlash 2s infinite',
      };
    },
    groupLabelStyle() {
      return {
        position: 'absolute',
        top: '-20px',
        right: '-10px',
        backgroundColor: 'var(--e-global-color-accent)',
        color: '#FFF',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        zIndex: 3,
      };
    },
    svgOverlayStyle() {
      return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)', // Centers the SVG
        width: '70%', // Adjust size as a percentage of the container
        height: '70%', // Maintain aspect ratio
        pointerEvents: 'none', // Prevent interaction
      };
    },
    svgStyle() {
      return {
        width: '100%',
        height: '100%',
        display: 'block', // Ensures SVG scales properly
        opacity: '1',
      };
    },
    animalMarkerImageContainer() {
      const baseWidth = 64; // Single marker width
      const overlapRatio = 0.6; // Overlap percentage
      const totalWidth =
        this.is_group && this.group_members.length > 1
          ? baseWidth +
            (this.group_members.length - 1) * baseWidth * (1 - overlapRatio)
          : baseWidth;

      const baseStyle = {
        width: `${totalWidth}px`, // Dynamic width for grouped markers
        height: '64px', // Fixed height
        borderRadius: '50%',
        overflow: 'hidden',
      };

      if (!this.is_group) {
        baseStyle.border = this.track_data.animal.is_owned
          ? '2px solid var(--e-global-color-accent)'
          : '2px solid rgb(68, 68, 68)';
      }

      return baseStyle;
    },
    imageStyle() {
      const baseStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      };

      // If the animal is not owned, append opacity and gray border to image
      if (!this.track_data.animal.is_owned) {
        baseStyle.opacity = 0.6;
        baseStyle.filter = 'grayscale(70%)'; // Add 70% grayscale filter
      }

      return baseStyle;
    },
    groupedImageStyle() {
      return (index) => {
        const overlapRatio = 0.6; // Overlap percentage for grouped markers
        const offset = index * 64 * (1 - overlapRatio); // Adjust left offset based on index
        const member = this.group_members[index];
        const isOwned = member.track_data.animal.is_owned;

        return {
          position: 'absolute',
          left: `${offset}px`, // Horizontal positioning for overlap
          top: '0', // Vertically aligned
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: isOwned
            ? '2px solid var(--e-global-color-accent)'
            : '2px solid #444',
          opacity: 1,
          zIndex: this.group_members.length - index, // Higher index stacks on top
          overflow: 'hidden', // Ensure image doesn't overflow
        };
      };
    },
    groupedImageContentStyle() {
      return (index) => {
        const member = this.group_members[index];
        const isOwned = member.track_data.animal.is_owned;

        return {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isOwned ? 1 : 0.6, // Only apply opacity to the image itself
          filter: isOwned ? 'none' : 'grayscale(70%)', // Apply 70% grayscale filter if not owned
        };
      };
    },
    animalMarkerLabelContainer() {
      return {
        /*display: "flex",*/
        display: 'none', //Removed the animal name from the marker
        justifyContent: 'center',
        width: 'auto',
      };
    },
    animalMarkerNameLabel() {
      return {
        backgroundColor: 'var(--e-global-color-accent)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#000',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: 'bold',
        padding: '2px 10px',
        whiteSpace: 'nowrap',
      };
    },
  },
};
